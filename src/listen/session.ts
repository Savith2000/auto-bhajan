// One listening session, from button press to answer, and in auto mode on
// through the bhajans that follow.
//
// Finding a bhajan:
//
//   mic ─▶ wait for something loud ─▶ every 1.5 s, ask the model whether
//   there are words yet (see words.ts) ─▶ at 3, 5, 7, 9 s after the first
//   words: transcribe everything since them and match it against the opening
//   of every bhajan ─▶ clear? show it ─▶ none clear by 10 s? show the top one,
//   unless another bhajan opens the same way (a twin): then keep checking
//   every 2 s until the line that tells them apart has been sung, 20 s at most
//
// Only a real match is ever shown (isMatch). If the top one at 10 s isn't, the
// "words" were music or talking: forget them and wait for words again.
//
// Without auto mode that is all: once an answer is shown the mic is released
// and the model sits idle until the next press.
//
// In auto mode the mic stays open and the session follows the bhajan on
// screen (follow.ts):
//
//   following ─▶ every 2 s, ask what the last 4 s hold ─▶ no words for 5 s,
//   or twice running words that fit nowhere in the bhajan on screen? it has
//   ended ─▶ armed: find the next one as above (after a pause from fresh,
//   after straying from where the words strayed) ─▶ a real answer whose
//   opening fits the words clearly better than anywhere in the bhajan on
//   screen? switch to it ─▶ following
//
// Anything else goes back to following the same bhajan: the answer was that
// bhajan, or the words were a line from its middle after a long pause, or
// three tries found no bhajan at all. Following never gives up; only stop()
// ends it, or the volunteer picking a bhajan by hand (follow()).
//
// If the mic dies on its own (a phone call, a locked screen), it is started
// again once; if that fails, or it dies again within 30 s, the session ends
// with mic-lost.

import { MicCapture, TARGET_SAMPLE_RATE } from "../audio/capture.ts";
import { RingBuffer } from "../audio/ring-buffer.ts";
import { matchKey, type Reference } from "../match/catalog.ts";
import { combine, isClear, isMatch, RULES, twinOf, type Ranking } from "../match/identify.ts";
import type { AsrClient } from "./asr-client.ts";
import { bhajanEnded, FOLLOW, judgeNext, lookEvery, strayCount, wordlessSince } from "./follow.ts";
import { ONSET, OnsetDetector } from "./onset.ts";
import { frameSample, WORDS } from "./words.ts";

/** Give up if nobody has sung a word by then; long enough for a musical introduction. */
export const NO_SINGING_SECONDS = 45;
/** Holds the last check plus the preroll, with room to spare. */
const BUFFER_SECONDS = RULES.twinDecideAfter + 5;
/** A mic that dies again this soon after being restarted is not coming back. */
const MIC_RESTART_MS = 30_000;

export type SessionOptions = {
  /** Keep listening after an answer and move to the next bhajan on its own. */
  auto?: boolean;
  /** Already showing this bhajan: start by following it (implies auto). */
  following?: number;
};

export type SessionUpdate =
  | { kind: "waiting"; seconds: number; level: number }
  | { kind: "hearing"; seconds: number; level: number }
  | {
      kind: "check";
      at: number;
      transcript: string;
      /** What the decision used: text and sound combined, or text alone. */
      ranking: Ranking | null;
      /** Each scorer on its own, for the matching details. */
      byText: Ranking | null;
      bySound: Ranking | null;
      /** The leader's twin, when listening goes on past decideAfter to tell them apart. */
      twin: number | null;
      inferenceMs: number;
    }
  | {
      kind: "identified";
      index: number;
      ranking: Ranking;
      /** It replaces a bhajan already on screen: the session moved on by itself. */
      switched: boolean;
    }
  /** Following this bhajan; armed once it seems to have ended and the next is being looked for. */
  | { kind: "following"; index: number; armed: boolean }
  | { kind: "gave-up"; ranking: Ranking | null; heardSinging: boolean }
  /** The mic stopped and could not be started again; the session has ended. */
  | { kind: "mic-lost"; message: string }
  | { kind: "error"; message: string };

/**
 * identify: finding the first bhajan, as after a press.
 * follow:   a bhajan is on screen; only listening for it to end.
 * armed:    it has ended; finding the next one.
 */
type Mode = "identify" | "follow" | "armed";

type Answer = { index: number; ranking: Ranking; query: string; byText: Ranking | null };

export class ListenSession {
  private readonly asr: AsrClient;
  private readonly refs: Reference[];
  private readonly refOf: Map<number, Reference>;
  private readonly onUpdate: (update: SessionUpdate) => void;
  private readonly buffer = new RingBuffer(BUFFER_SECONDS * TARGET_SAMPLE_RATE);
  private auto: boolean;
  private mode: Mode = "identify";
  /** The bhajan being followed (follow and armed). */
  private current: number | null = null;
  /**
   * Bumped whenever the plan changes under a step in flight (follow(), a mic
   * restart), so that step drops what it was doing once it next looks up.
   */
  private epoch = 0;
  /** Something loud has started: time to look for words. Replaced when armed. */
  private onset = new OnsetDetector();
  /** Sample index where that detector started, since its own count starts at 0. */
  private onsetFrom = 0;
  /**
   * Where a search may start without waiting for a loud sound (sample index):
   * set when the next bhajan began with no pause, so it is already being sung.
   */
  private woke: number | null = null;
  /** Straying from the bhajan on screen is not looked for before this sample. */
  private strayFrom = 0;
  /** Sample index (since the press) where the words begin, preroll included. */
  private words: number | null = null;
  /** After a false start, words are only looked for in audio from here on. */
  private lookFrom = 0;
  /** Words that matched no bhajan, since the last answer. */
  private falseStarts = 0;
  private mic: MicCapture | null = null;
  /** When the mic was last started again after dying (performance.now()). */
  private restartedAt = -Infinity;
  private heard = 0;
  private stopped = false;
  private wake: (() => void) | null = null;

  constructor(
    asr: AsrClient,
    refs: Reference[],
    onUpdate: (update: SessionUpdate) => void,
    { auto = false, following }: SessionOptions = {},
  ) {
    this.asr = asr;
    this.refs = refs;
    this.refOf = new Map(refs.map((r) => [r.index, r]));
    this.onUpdate = onUpdate;
    this.auto = auto || following !== undefined;
    if (following !== undefined) {
      this.mode = "follow";
      this.current = following;
    }
  }

  async start(): Promise<void> {
    try {
      this.mic = await this.openMic();
    } catch (error) {
      this.fail(error);
      return;
    }
    if (this.current !== null) this.onUpdate({ kind: "following", index: this.current, armed: false });
    void this.run();
  }

  /**
   * The volunteer put this bhajan on screen by hand (search, or Back): follow
   * it from now, dropping whatever was under way.
   */
  follow(index: number): void {
    if (this.stopped) return;
    this.auto = true;
    this.followNow(index);
    this.epoch++;
    this.wake?.();
  }

  /** Cancel: nothing more is reported after this. */
  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    this.wake?.();
    await this.releaseMic();
  }

  private openMic(): Promise<MicCapture> {
    return MicCapture.start(
      (frame) => {
        this.buffer.write(frame.samples);
        this.heard += frame.samples.length;
        this.onset.push(frame.rms, frame.samples.length);
        // The listening ring is only for a press; following is silent.
        if (this.mode === "identify") {
          this.onUpdate(
            this.words === null
              ? { kind: "waiting", seconds: this.heard / TARGET_SAMPLE_RATE, level: frame.rms }
              : { kind: "hearing", seconds: this.sinceOnset(), level: frame.rms },
          );
        }
        this.wake?.();
      },
      () => {},
      { onEnd: (reason) => void this.micEnded(reason) },
    );
  }

  private async releaseMic(): Promise<void> {
    const mic = this.mic;
    this.mic = null;
    await mic?.stop();
  }

  /**
   * The mic stopped by itself: start it again, once. Capture has already let
   * go of the old one, so this only has to open a new one.
   */
  private async micEnded(reason: string): Promise<void> {
    if (this.stopped) return;
    await this.releaseMic();
    const now = performance.now();
    if (now - this.restartedAt < MIC_RESTART_MS) return this.micLost(reason);
    this.restartedAt = now;
    let mic;
    try {
      mic = await this.openMic();
    } catch (error) {
      return this.micLost(error instanceof Error ? error.message : String(error));
    }
    if (this.stopped) {
      await mic.stop();
      return;
    }
    this.mic = mic;
    // A search under way now has a hole in its audio, so it starts again
    // from the new mic. Following only asks about the last few seconds, and
    // just carries on.
    if (this.mode === "identify") {
      this.listenAfresh();
      this.epoch++;
      this.wake?.();
    }
  }

  private micLost(message: string): void {
    void this.stop();
    this.onUpdate({ kind: "mic-lost", message });
  }

  private sinceOnset(): number {
    if (this.words === null) return 0;
    return (this.heard - this.words - ONSET.prerollSamples) / TARGET_SAMPLE_RATE;
  }

  /** Whether the step started at `epoch` should drop what it is doing. */
  private overtaken(epoch: number): boolean {
    return this.stopped || epoch !== this.epoch;
  }

  /** Resolves on the next audio frame (or stop, or a change of plan). */
  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = () => {
        this.wake = null;
        resolve();
      };
    });
  }

  /** Look for words from fresh: a new detector, and only in audio from now on. */
  private listenAfresh(): void {
    this.onset = new OnsetDetector();
    this.onsetFrom = this.heard;
    this.woke = null;
    this.words = null;
    this.lookFrom = this.heard;
  }

  private followNow(index: number): void {
    // Back to the same bhajan after searching for the next one: whatever made
    // the words seem to stray, don't search again on it straight away.
    this.strayFrom = this.mode === "armed" && index === this.current ? this.heard + FOLLOW.strayRestSamples : 0;
    this.mode = "follow";
    this.current = index;
    this.words = null;
    this.falseStarts = 0;
    this.onUpdate({ kind: "following", index, armed: false });
  }

  /**
   * Find the next bhajan: after a pause, from fresh; when the words strayed
   * from the bhajan on screen, from where they strayed, with no loud start to
   * wait for, since the singing is already going.
   */
  private arm(strayed: number | null): void {
    this.mode = "armed";
    this.listenAfresh();
    if (strayed !== null) this.woke = this.lookFrom = strayed;
    this.falseStarts = 0;
    this.onUpdate({ kind: "following", index: this.current!, armed: true });
  }

  private async run(): Promise<void> {
    while (!this.stopped) {
      const epoch = this.epoch;
      if (this.mode === "follow") {
        const ended = await this.waitForEnd(epoch);
        if (ended !== null) this.arm(ended === "pause" ? null : ended);
        continue;
      }

      // identify or armed: the same search either way.
      if (!(await this.waitForWords(this.falseStarts > 0, epoch))) continue;
      const outcome = await this.checkpoints(epoch);
      if (this.overtaken(epoch) || outcome === "done") continue;

      if (outcome === "false start") {
        // Words that turn out to match no bhajan (an instrument the model half
        // heard as syllables, or talking) are a false start: forget them and
        // wait for words again, rather than show a guess. While armed, a few
        // of those mean the bhajan on screen never ended: go back to it.
        this.falseStarts++;
        if (this.mode === "armed" && this.falseStarts >= FOLLOW.maxFalseStarts) this.followNow(this.current!);
        else {
          this.words = null;
          this.lookFrom = this.heard;
        }
        continue;
      }

      if (this.mode === "identify") {
        if (!this.auto) await this.stop();
        this.onUpdate({ kind: "identified", index: outcome.index, ranking: outcome.ranking, switched: false });
        if (this.auto && !this.stopped) this.followNow(outcome.index);
        continue;
      }

      const current = this.current!;
      const leader = this.refOf.get(outcome.index)!;
      if (judgeNext(this.refOf.get(current), leader, outcome.query, outcome.byText) === "switch") {
        this.onUpdate({ kind: "identified", index: outcome.index, ranking: outcome.ranking, switched: true });
        this.followNow(outcome.index);
      } else {
        this.followNow(current);
      }
    }
  }

  /**
   * Following: every so often, ask the model what the last few seconds hold,
   * without scoring the catalog. "pause" once no words have come for
   * gapSeconds; the sample where they began once words that fit nowhere in the
   * bhajan on screen have come strayLooks looks in a row; null when the
   * session ended or the plan changed.
   */
  private async waitForEnd(epoch: number): Promise<"pause" | number | null> {
    let looked = this.heard;
    let every = FOLLOW.everySamples;
    let since: number | null = null;
    let strayed = 0;
    let strayedFrom = 0;
    for (;;) {
      if (this.overtaken(epoch)) return null;
      if (this.heard - looked < every) {
        await this.nextFrame();
        continue;
      }
      looked = this.heard;
      const length = Math.min(this.heard, WORDS.windowSamples);
      let result;
      try {
        result = await this.asr.transcribe(this.buffer.readLast(length), { score: false });
      } catch (error) {
        this.fail(error);
        return null;
      }
      if (this.overtaken(epoch)) return null;
      since = wordlessSince(since, looked - length, result.wordFrame !== null);
      if (bhajanEnded(since, looked)) return "pause";
      const count = strayCount(strayed, this.refOf.get(this.current!), matchKey(result.text));
      if (count === 1) strayedFrom = looked - length;
      strayed = count;
      if (strayed >= FOLLOW.strayLooks && looked >= this.strayFrom) return strayedFrom;
      every = lookEvery(result.inferenceMs);
    }
  }

  /**
   * 1. Wait for something loud, then for words in it: every so often, ask the
   * model whether the audio since holds any. False when the session ended or
   * the plan changed.
   */
  private async waitForWords(heardWords: boolean, epoch: number): Promise<boolean> {
    let looked = 0;
    while (this.words === null) {
      if (this.overtaken(epoch)) return false;
      // Only a press gives up; following waits as long as the bhajans go on.
      if (this.mode === "identify" && this.heard / TARGET_SAMPLE_RATE >= NO_SINGING_SECONDS) {
        await this.stop();
        this.onUpdate({ kind: "gave-up", ranking: null, heardSinging: heardWords });
        return false;
      }
      const loud = this.onset.onset === null ? this.woke : this.onsetFrom + this.onset.onset;
      const from = loud === null ? null : Math.max(loud, this.lookFrom);
      if (from === null || this.heard - Math.max(looked, from) < WORDS.everySamples) {
        await this.nextFrame();
        continue;
      }
      looked = this.heard;
      const length = Math.min(this.heard - from, WORDS.windowSamples);
      const start = this.heard - length;
      let result;
      try {
        result = await this.asr.transcribe(this.buffer.readLast(length), { score: false });
      } catch (error) {
        this.fail(error);
        return false;
      }
      if (this.overtaken(epoch)) return false;
      if (result.wordFrame !== null) {
        const first = frameSample(start, length, result.frames, result.wordFrame);
        this.words = Math.max(from, first - ONSET.prerollSamples);
      }
    }
    return true;
  }

  /**
   * 2. Check at each checkpoint. From decideAfter on, every check answers
   * unless the leader has a twin; the last, at twinDecideAfter, always does.
   * Only a real match is ever an answer (isMatch): none by decideAfter means
   * the words were a false start. "done" when the session ended or the plan
   * changed.
   */
  private async checkpoints(epoch: number): Promise<Answer | "done" | "false start"> {
    const words = this.words!;
    const times = [...RULES.checkpoints, RULES.decideAfter, ...RULES.twinCheckpoints, RULES.twinDecideAfter];
    for (const [i, at] of times.entries()) {
      const final = i === times.length - 1;
      const deciding = at >= RULES.decideAfter;
      while (this.sinceOnset() < at) {
        if (this.overtaken(epoch)) return "done";
        await this.nextFrame();
      }
      if (this.overtaken(epoch)) return "done";

      const clip = this.buffer.readLast(this.heard - words);
      // Exactly preroll + `at` seconds, even if inference fell behind.
      const window = clip.slice(0, ONSET.prerollSamples + at * TARGET_SAMPLE_RATE);
      // No more listening after the last check; the mic goes off while it
      // runs. Not in auto mode, which listens on whatever the answer.
      if (final && !this.auto) await this.releaseMic();

      let result;
      try {
        result = await this.asr.transcribe(window);
      } catch (error) {
        this.fail(error);
        return "done";
      }
      if (this.overtaken(epoch)) return "done";

      // Both rankings arrive from the worker, so the page never stalls on them.
      const query = matchKey(result.text);
      const byText = result.byText;
      const bySound = result.sound;
      const ranking = byText && bySound ? combine(byText, bySound, this.refs) : byText;
      const top = ranking?.candidates[0];
      const real = isMatch(ranking);
      const twin =
        real && deciding && !final && !isClear(ranking) ? twinOf(ranking!, this.refs, [...query].length) : null;
      this.onUpdate({
        kind: "check",
        at,
        transcript: result.text,
        ranking,
        byText: byText && { ...byText, candidates: byText.candidates.slice(0, 3) },
        bySound: bySound && { ...bySound, candidates: bySound.candidates.slice(0, 3) },
        twin,
        inferenceMs: result.inferenceMs + result.soundMs + result.textMs,
      });

      if (top && real && (isClear(ranking) || (deciding && twin === null))) {
        return { index: top.index, ranking: ranking!, query, byText };
      }
      if (deciding && !real) {
        // Armed, nothing gives up: even the last check is only a false start.
        if (!final || this.mode === "armed") return "false start";
        await this.stop();
        this.onUpdate({ kind: "gave-up", ranking: null, heardSinging: true });
        return "done";
      }
    }
    return "done";
  }

  private fail(error: unknown): void {
    void this.stop();
    this.onUpdate({
      kind: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
