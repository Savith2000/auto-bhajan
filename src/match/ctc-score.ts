// Scoring bhajans against what the model *heard*, not what it wrote down.
//
// The text matcher (identify.ts) works on the model's greedy transcript: one
// best letter per 20 ms frame, everything else thrown away. On clean speech
// that is fine. On singing the model is unsure — "60% ज, 30% य" — and the
// greedy transcript keeps only the 60%, so a bhajan whose words were the 30%
// loses the evidence that would have found it.
//
// So instead each bhajan's opening is force-aligned against the model's full
// per-frame probabilities (CTC Viterbi, as in keyword spotting): "how likely
// is it that this audio is someone singing *these* words?" Every candidate is
// asked the same question about the same frames, so the scores compare
// directly.
//
// The model's 67 tokens are first folded into the normaliser's sound classes
// (श/ष/स → स, every nasal → न, long and short vowels together, aspirated with
// plain), by summing their probabilities, so this ignores exactly the
// distinctions the text matcher ignores. Tokens the normaliser deletes (ा, ्,
// visarga, the word separator) are folded into the CTC blank.

import { matchKey } from "./catalog.ts";

export type SoundClasses = {
  /** Number of classes; class 0 is the blank. */
  count: number;
  /** For each model token, its class, or -1 to ignore it. */
  ofToken: Int16Array;
  /** Normalised character → class. */
  ofChar: Map<string, number>;
};

export function soundClasses(tokens: string[], blankId: number): SoundClasses {
  const ofChar = new Map<string, number>();
  const ofToken = new Int16Array(tokens.length).fill(-1);
  let count = 1;
  tokens.forEach((token, id) => {
    if (id === blankId) {
      ofToken[id] = 0;
      return;
    }
    // Special tokens (<pad>, </s>, <unk>) never carry sound.
    if (!token || token.startsWith("<")) return;
    const key = matchKey(token);
    if (key === "") {
      ofToken[id] = 0;
      return;
    }
    if ([...key].length !== 1) return;
    let cls = ofChar.get(key);
    if (cls === undefined) {
      cls = count++;
      ofChar.set(key, cls);
    }
    ofToken[id] = cls;
  });
  return { count, ofToken, ofChar };
}

/**
 * Per-frame log-probabilities of each sound class, from raw [frames × vocab]
 * logits: softmax over the vocabulary, sum within each class, log.
 */
export function classLogProbs(
  logits: Float32Array,
  frames: number,
  vocabSize: number,
  classes: SoundClasses,
): Float32Array {
  const C = classes.count;
  const out = new Float32Array(frames * C);
  const sums = new Float64Array(C);
  for (let t = 0; t < frames; t++) {
    const row = t * vocabSize;
    let max = -Infinity;
    for (let v = 0; v < vocabSize; v++) if (logits[row + v] > max) max = logits[row + v];
    let total = 0;
    sums.fill(0);
    for (let v = 0; v < vocabSize; v++) {
      const p = Math.exp(logits[row + v] - max);
      total += p;
      const cls = classes.ofToken[v];
      if (cls >= 0) sums[cls] += p;
    }
    for (let c = 0; c < C; c++) {
      // A floor, so a class the model never considered is very unlikely
      // rather than impossible: one unheard syllable must not veto a bhajan.
      out[t * C + c] = Math.log(Math.max(sums[c] / total, 1e-8));
    }
  }
  return out;
}

/**
 * A normalised reference as class indices. ॐ, which the model has no token
 * for, is heard as "om" (ओ + न after normalisation). Anything else outside the
 * model's alphabet (stray Latin letters in a few catalog entries) is dropped.
 */
export function encode(key: string, classes: SoundClasses, maxLength = Infinity): Int16Array {
  const out: number[] = [];
  for (const char of key.replace(/ॐ/g, "ओन")) {
    const cls = classes.ofChar.get(char);
    if (cls !== undefined) out.push(cls);
    if (out.length >= maxLength) break;
  }
  return Int16Array.from(out);
}

/** How far into a bhajan the alignment may start for free, in letters. */
export const CTC_START_SLACK = 3;
/** States further than this below the frame's best are dropped (log units). */
const BEAM = 18;

/**
 * Best log-probability of any CTC alignment of the audio to a *prefix* of
 * `labels`: anchored at the start (within CTC_START_SLACK letters), free at
 * the end, because a few seconds of audio cover only the opening of a bhajan.
 *
 * Viterbi (max) rather than the full forward sum: no exp/log per cell, and the
 * ranking is near identical. Beam-pruned, so the cost is roughly frames × a
 * few dozen states rather than frames × the whole reference.
 */
export function prefixScore(
  lp: Float32Array,
  frames: number,
  C: number,
  labels: Int16Array,
): number {
  const L = labels.length;
  if (L === 0 || frames === 0) return -Infinity;
  const S = 2 * L + 1;
  // State s: even = blank before label s/2, odd = label (s-1)/2.
  const label = (s: number) => (s & 1 ? labels[(s - 1) >> 1] : 0);

  let prev = new Float32Array(S).fill(-Infinity);
  let curr = new Float32Array(S).fill(-Infinity);
  let lo = 0;
  let hi = Math.min(S - 1, 2 * CTC_START_SLACK + 1);
  for (let s = lo; s <= hi; s++) prev[s] = lp[label(s)];
  // `curr` holds stale values in [staleLo, staleHi] from two frames ago.
  let staleLo = 0;
  let staleHi = -1;

  for (let t = 1; t < frames; t++) {
    for (let s = staleLo; s <= staleHi; s++) curr[s] = -Infinity;
    const row = t * C;
    const top = Math.min(S - 1, hi + 2);
    let best = -Infinity;
    for (let s = lo; s <= top; s++) {
      let m = prev[s];
      if (s >= 1 && prev[s - 1] > m) m = prev[s - 1];
      if (s & 1 && s >= 3 && labels[(s - 1) >> 1] !== labels[(s - 3) >> 1] && prev[s - 2] > m) {
        m = prev[s - 2];
      }
      if (m === -Infinity) continue;
      const v = m + lp[row + label(s)];
      curr[s] = v;
      if (v > best) best = v;
    }
    // Prune to the band within BEAM of this frame's best.
    let newLo = lo;
    while (newLo < top && curr[newLo] < best - BEAM) curr[newLo++] = -Infinity;
    let newHi = top;
    while (newHi > newLo && curr[newHi] < best - BEAM) curr[newHi--] = -Infinity;

    staleLo = lo;
    staleHi = hi;
    [prev, curr] = [curr, prev];
    lo = newLo;
    hi = newHi;
  }

  let best = -Infinity;
  for (let s = lo; s <= hi; s++) if (prev[s] > best) best = prev[s];
  return best;
}
