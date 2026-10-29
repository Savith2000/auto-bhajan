// Following the bhajan on screen, and noticing when the next one starts.
//
// Once a bhajan is showing, the session keeps listening, but only asks the
// cheapest question: are there words in the last few seconds (words.ts)? A
// bhajan sings with short breaths between lines and the group's repeats, so
// words keep coming. When none come for gapSeconds, the bhajan has ended, and
// the session listens for the next one's opening exactly as it does after a
// press. So it does when the words keep coming but stop fitting the bhajan on
// screen: the next one began without a pause (strayCount).
//
// Never showing a wrong bhajan matters more here than anywhere: nobody pressed
// anything, so a wrong switch takes the right slide away from people singing
// it. A long instrumental or a pause inside the bhajan also looks like an end,
// and the line that comes after it may fit the opening of some other bhajan.
// So a new answer only replaces the one on screen if its opening fits the
// words clearly better than anywhere in the bhajan already showing. A missed
// switch costs one tap; a wrong one costs the room.
//
// Pure, like onset.ts and words.ts, so it is tested without a mic.

import type { Reference } from "../match/catalog.ts";
import { anywhereScore, rank, RULES, sameLyrics, type Ranking } from "../match/identify.ts";

// TARGET_SAMPLE_RATE, not imported: capture.ts loads the audio worklet, which
// Node cannot, and the tests import this file.
const RATE = 16_000;

export const FOLLOW = {
  /** How often to look for words while a bhajan is on screen (16 kHz samples): 2 s. */
  everySamples: 32_000,
  /** The longest that may stretch to on a slow device (see lookEvery): 6 s. */
  slowestEverySamples: 96_000,
  /** The share of the time between looks the model may spend on them. */
  costShare: 0.25,
  /** No words for this long means the bhajan has ended (a pause between lines is shorter). */
  gapSeconds: 5,
  /** Failed attempts at a new bhajan before going back to following the current one. */
  maxFalseStarts: 3,
  /** A new bhajan's opening must fit the words better than anywhere in the current bhajan by this much (0–1). */
  vetoMargin: 0.1,
  /**
   * Words that fit nowhere in the bhajan on screen score below this
   * (anywhereScore)... On the test recordings a few seconds of a bhajan never
   * scored under 0.55 against its own lyrics, and another bhajan's words
   * reached 0.5 about one time in fourteen.
   */
  strayScore: 0.5,
  /** ...and this many looks in a row of them means the next bhajan began without a pause. */
  strayLooks: 2,
  /** After a search that found nothing new, straying is not looked for again for this long: 30 s. */
  strayRestSamples: 480_000,
};

/**
 * Where the current stretch without words began (sample index), after one
 * more look: null once a look hears words, otherwise the start of the first
 * wordless look's window. Each look covers a window of recent audio, so the
 * stretch dates from the start of that window, not from when it was looked at.
 */
export function wordlessSince(since: number | null, lookStart: number, words: boolean): number | null {
  return words ? null : (since ?? lookStart);
}

/** Whether a stretch without words, as of `now` (the end of the last look), is long enough to be the end of a bhajan. */
export function bhajanEnded(since: number | null, now: number, gapSeconds = FOLLOW.gapSeconds): boolean {
  return since !== null && now - since >= gapSeconds * RATE;
}

/**
 * How many looks in a row have heard words that fit nowhere in the bhajan on
 * screen, after one more look with match key `query`. A look with no words,
 * or too few to judge, starts the count again.
 *
 * The other way a bhajan ends. Usually there is a pause before the next one
 * (bhajanEnded), but a leader may start the next straight after the last
 * note, and then there is no pause until that one ends too. So the words
 * themselves are checked against the bhajan on screen: when they stop fitting
 * it, something else is being sung.
 */
export function strayCount(count: number, current: Reference | undefined, query: string, follow: typeof FOLLOW = FOLLOW): number {
  if (!current || query.length < RULES.minQueryLength) return 0;
  return anywhereScore(query, current) < follow.strayScore ? count + 1 : 0;
}

/**
 * Samples to wait before the next look, given what the last one cost. Looks
 * run for as long as a bhajan is on screen, maybe an hour, so on a phone that
 * transcribes slowly they are spaced out until they take at most costShare of
 * the time, and come back to every 2 s once they are cheap again.
 */
export function lookEvery(inferenceMs: number, follow: typeof FOLLOW = FOLLOW): number {
  const cost = (inferenceMs / 1000) * RATE;
  return Math.round(Math.min(follow.slowestEverySamples, Math.max(follow.everySamples, cost / follow.costShare)));
}

/**
 * What to do when listening for the next bhajan has a real answer, `leader`,
 * while `current` is on screen. `query` is the transcript's match key and
 * `byText` its ranking by words over the whole catalog.
 *
 *   "same"    the leader is the bhajan on screen, or the same lyrics catalogued twice
 *   "veto"    the words fit somewhere in the bhajan on screen about as well as the
 *             leader's opening: most likely a line from its middle after a pause
 *   "switch"  a different bhajan has started
 *
 * `current` is undefined for a bhajan with no lyrics to match against; then
 * nothing can be compared, and only the leader's own score counts.
 */
export function judgeNext(
  current: Reference | undefined,
  leader: Reference,
  query: string,
  byText: Ranking | null,
  margin = FOLLOW.vetoMargin,
): "same" | "veto" | "switch" {
  if (current && (leader.index === current.index || sameLyrics(leader.text, current.text))) return "same";
  const opening =
    byText?.candidates.find((c) => c.index === leader.index)?.score ?? rank(query, [leader]).candidates[0]?.score ?? 0;
  const anywhere = current ? anywhereScore(query, current) : 0;
  return opening - anywhere < margin ? "veto" : "switch";
}
