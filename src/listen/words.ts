// Is anyone actually singing yet?
//
// The loudness detector (onset.ts) only says something loud has started, and
// at a bhajan that is as often the harmonium or tabla introduction as the lead
// singer. Guessing from there spent the 10 s on music. So loud sound only wakes
// the listener: from then on the speech model is asked every 1.5 s whether the
// last few seconds hold words, and the countdown to an answer starts where it
// first writes them out. On harmonium and tabla it writes nothing at all
// (measured), so music, however loud, never starts the countdown. Pure, so the
// eval runs it exactly as the browser does.

import type { Vocab } from "../asr/ctc.ts";

export const WORDS = {
  /** How often to look for words once something loud has started (16 kHz samples): 1.5 s. */
  everySamples: 24_000,
  /** How much recent audio each look covers: 4 s, so looks overlap. */
  windowSamples: 64_000,
  /** Letters the model must write before it counts as words, not a stray sound. */
  minLetters: 4,
};

/**
 * The frame where words begin in one look's per-frame best tokens, or null if
 * the model wrote fewer than minLetters letters (word breaks don't count).
 */
export function firstWordFrame(ids: number[], { tokens, blankId }: Vocab, minLetters = WORDS.minLetters): number | null {
  let first: number | null = null;
  let letters = 0;
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === blankId || tokens[ids[i]] === "|" || ids[i] === ids[i - 1]) continue;
    first ??= i;
    letters++;
  }
  return letters >= minLetters ? first : null;
}

/** The sample (since the press) a look's frame falls on. */
export function frameSample(lookStart: number, lookLength: number, frames: number, frame: number): number {
  return lookStart + Math.round((frame * lookLength) / frames);
}
