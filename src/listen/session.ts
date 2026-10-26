// One "which bhajan is this?" attempt, from button press to answer.
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
// The model runs only at those moments. Once an answer is shown the mic is
// released and the model sits idle until the next press.

import { MicCapture, TARGET_SAMPLE_RATE } from "../audio/capture.ts";
import { RingBuffer } from "../audio/ring-buffer.ts";
import { matchKey, type Reference } from "../match/catalog.ts";
import { combine, isClear, isMatch, rank, RULES, twinOf, type Ranking } from "../match/identify.ts";
import type { AsrClient } from "./asr-client.ts";
import { ONSET, OnsetDetector } from "./onset.ts";
import { frameSample, WORDS } from "./words.ts";

/** Give up if nobody has sung a word by then; long enough for a musical introduction. */
export const NO_SINGING_SECONDS = 45;
/** Holds the last check plus the preroll, with room to spare. */
const BUFFER_SECONDS = RULES.twinDecideAfter + 5;

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
  | { kind: "identified"; index: number; ranking: Ranking }
  | { kind: "gave-up"; ranking: Ranking | null; heardSinging: boolean }
  | { kind: "error"; message: string };

export class ListenSession {
  private readonly asr: AsrClient;
  private readonly refs: Reference[];
  private readonly onUpdate: (update: SessionUpdate) => void;
  private readonly buffer = new RingBuffer(BUFFER_SECONDS * TARGET_SAMPLE_RATE);
  /** Something loud has started: time to look for words. */
  private readonly onset = new OnsetDetector();
  /** Sample index (since the press) where the words begin, preroll included. */
  private words: number | null = null;
  /** After a false start, words are only looked for in audio from here on. */
  private lookFrom = 0;
  private mic: MicCapture | null = null;
  private heard = 0;
  private stopped = false;
  private wake: (() => void) | null = null;

  constructor(
    asr: AsrClient,
    refs: Reference[],
    onUpdate: (update: SessionUpdate) => void,
  ) {
    this.asr = asr;
    this.refs = refs;
    this.onUpdate = onUpdate;
  }

  async start(): Promise<void> {
    try {
      this.mic = await MicCapture.start(
        (frame) => {
          this.buffer.write(frame.samples);
          this.heard += frame.samples.length;
          this.onset.push(frame.rms, frame.samples.length);
          this.onUpdate(
            this.words === null
              ? { kind: "waiting", seconds: this.heard / TARGET_SAMPLE_RATE, level: frame.rms }
              : { kind: "hearing", seconds: this.sinceOnset(), level: frame.rms },
          );
          this.wake?.();
        },
        () => {},
      );
    } catch (error) {
      this.fail(error);
      return;
    }
    void this.run();
  }

  /** Cancel: nothing more is reported after this. */
  async stop(): Promise<void> {
    if (this.stopped) return;
    this.stopped = true;
    this.wake?.();
    await this.releaseMic();
  }

  private async releaseMic(): Promise<void> {
    const mic = this.mic;
    this.mic = null;
    await mic?.stop();
  }

  private sinceOnset(): number {
    if (this.words === null) return 0;
    return (this.heard - this.words - ONSET.prerollSamples) / TARGET_SAMPLE_RATE;
  }

  /** Resolves on the next audio frame (or stop). */
  private nextFrame(): Promise<void> {
    return new Promise((resolve) => {
      this.wake = () => {
        this.wake = null;
        resolve();
      };
    });
  }

  private async run(): Promise<void> {
    // Words that turn out to match no bhajan (an instrument the model half
    // heard as syllables, or talking) are a false start: forget them and wait
    // for words again, rather than show a guess.
    let falseStarts = 0;
    for (;;) {
      if (!(await this.waitForWords(falseStarts > 0))) return;
      if ((await this.checkpoints()) !== "false start") return;
      falseStarts++;
      this.words = null;
      this.lookFrom = this.heard;
    }
  }

  /**
   * 1. Wait for something loud, then for words in it: every so often, ask the
   * model whether the audio since holds any. False when the session ended.
   */
  private async waitForWords(heardWords: boolean): Promise<boolean> {
    let looked = 0;
    while (this.words === null) {
      if (this.stopped) return false;
      if (this.heard / TARGET_SAMPLE_RATE >= NO_SINGING_SECONDS) {
        await this.stop();
        this.onUpdate({ kind: "gave-up", ranking: null, heardSinging: heardWords });
        return false;
      }
      const loud = this.onset.onset;
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
   * Only a real match is ever shown (isMatch): none by decideAfter means the
   * words were a false start.
   */
  private async checkpoints(): Promise<"done" | "false start"> {
    const words = this.words!;
    const times = [...RULES.checkpoints, RULES.decideAfter, ...RULES.twinCheckpoints, RULES.twinDecideAfter];
    for (const [i, at] of times.entries()) {
      const final = i === times.length - 1;
      const deciding = at >= RULES.decideAfter;
      while (this.sinceOnset() < at) {
        if (this.stopped) return "done";
        await this.nextFrame();
      }
      if (this.stopped) return "done";

      const clip = this.buffer.readLast(this.heard - words);
      // Exactly preroll + `at` seconds, even if inference fell behind.
      const window = clip.slice(0, ONSET.prerollSamples + at * TARGET_SAMPLE_RATE);
      // No more listening after the last check; the mic goes off while it runs.
      if (final) await this.releaseMic();

      let result;
      try {
        result = await this.asr.transcribe(window);
      } catch (error) {
        this.fail(error);
        return "done";
      }
      if (this.stopped) return "done";

      const query = matchKey(result.text);
      const byText = query ? rank(query, this.refs, { keep: Infinity }) : null;
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
        inferenceMs: result.inferenceMs + result.soundMs,
      });

      if (top && real && (isClear(ranking) || (deciding && twin === null))) {
        await this.stop();
        this.onUpdate({ kind: "identified", index: top.index, ranking: ranking! });
        return "done";
      }
      if (deciding && !real) {
        if (!final) return "false start";
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
