// Which bhajan is this?
//
// Voice-seva's idea, reused: this is a matching problem, not a transcription
// problem. The model's Devanagari will be wrong, but consistently wrong, and
// after normalisation it only has to land closer to one bhajan than to every
// other. So each transcript is aligned against every bhajan in the catalog and
// the question becomes "which one fits best, and by how much?"
//
// Unlike voice-seva, which follows a chant from anywhere, this knows where the
// audio starts: the listening session cuts it from the first sung word. So the
// transcript is aligned against the *opening* of each bhajan, not anywhere in
// it, and a phrase like "hara hara" stops matching every bhajan that happens to
// contain it on line four.
//
// Two numbers come back, as in voice-seva's matcher:
//   score   how well the best bhajan fits (1 = perfect)
//   margin  how far ahead of the next-best bhajan it is
// A good score with no margin means two bhajans open the same way. That needs
// more audio, not a guess.

import type { Reference } from "./catalog.ts";
import { encode, prefixScore, type SoundClasses } from "./ctc-score.ts";
import { cer } from "./normalize.ts";

export type Candidate = {
  /** Index into the catalog. */
  index: number;
  score: number;
};

export type Ranking = {
  /**
   * "text": scored against the greedy transcript by edit distance (0–1).
   * "sound": scored against the model's per-frame probabilities (ctc-score.ts);
   *   score is the geometric-mean probability of the best alignment per frame.
   * "combined": both, each as standard deviations above the catalog's mean,
   *   summed and re-standardised. This is what the app decides on.
   */
  kind: "text" | "sound" | "combined";
  /** Best first. */
  candidates: Candidate[];
  /** Best score minus the best score of a bhajan with clearly different lyrics. */
  margin: number;
  /** Normalised length of the query, in characters. */
  queryLength: number;
};

/**
 * How far into a bhajan the transcript may start at no cost, in normalised
 * characters (~1–2 syllables). Covers a first syllable swallowed before the
 * onset detector fired, or dropped by the model. Starting later than this
 * costs one edit per character, so the alignment is anchored to the opening
 * without being brittle about it.
 */
export const START_SLACK = 4;

/**
 * Edit distance of `query` against the best-fitting stretch of `text` that
 * starts near the beginning.
 *
 * Levenshtein where the query must be consumed in full and may end anywhere in
 * the bhajan (a 3-second clip covers only the start of it), and may begin
 * within `startSlack` characters of the start for free. `startSlack = Infinity`
 * gives voice-seva's free-start substring search.
 */
export function alignDistance(query: string, text: string, startSlack = START_SLACK): number {
  const m = query.length;
  const n = text.length;
  if (m === 0) return 0;
  if (n === 0) return m;

  let prev = new Int32Array(n + 1);
  let curr = new Int32Array(n + 1);
  // Row 0: the cost of skipping the first j characters of the bhajan.
  for (let j = 0; j <= n; j++) prev[j] = Math.max(0, j - startSlack);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    const qc = query.charCodeAt(i - 1);
    for (let j = 1; j <= n; j++) {
      const sub = prev[j - 1] + (qc === text.charCodeAt(j - 1) ? 0 : 1);
      const del = prev[j] + 1;
      const ins = curr[j - 1] + 1;
      curr[j] = sub < del ? (sub < ins ? sub : ins) : del < ins ? del : ins;
    }
    [prev, curr] = [curr, prev];
  }

  let best = prev[0];
  for (let j = 1; j <= n; j++) if (prev[j] < best) best = prev[j];
  return best;
}

/** Score every bhajan against an already-normalised query. */
export function rank(
  query: string,
  refs: Reference[],
  { keep = 5, startSlack = START_SLACK } = {},
): Ranking {
  const m = query.length;
  if (m === 0) return { kind: "text", candidates: [], margin: 0, queryLength: 0 };

  // Scored against the lyrics as written and as sung (every line twice), and
  // the better of the two counts: a leader without a group, or a clip that has
  // not reached the repeat yet, fits the first; anything later fits the second.
  const scored = refs.map((ref) => {
    const distance = Math.min(
      alignDistance(query, ref.text, startSlack),
      alignDistance(query, ref.sung, startSlack),
    );
    return { ref, score: Math.max(0, 1 - distance / m) };
  });
  scored.sort((a, b) => b.score - a.score);

  // Some bhajans are catalogued twice, with identical lyrics or nearly so
  // ("…Namah Om" / "…Namah Aum", "Vitthale" / "Vitthala"). Against each other
  // they tie forever, which is not ambiguity worth waiting on: either answer
  // shows essentially the same words. So the rival is the best bhajan whose
  // lyrics clearly differ.
  const best = scored[0];
  const rival = scored.find((s) => !sameLyrics(s.ref.text, best.ref.text));
  const margin = rival ? best.score - rival.score : best.score;

  return {
    kind: "text",
    candidates: scored.slice(0, keep).map((s) => ({ index: s.ref.index, score: s.score })),
    margin,
    queryLength: m,
  };
}

// --- scoring against the model's probabilities ------------------------------

export type EncodedReference = {
  index: number;
  /** For sameLyrics(). */
  key: string;
  text: Int16Array;
  sung: Int16Array;
};

/** Enough of each bhajan for the longest clip: ~25 s of singing. */
const ENCODED_LENGTH = 300;

export function encodeReferences(refs: Reference[], classes: SoundClasses): EncodedReference[] {
  return refs.map((ref) => ({
    index: ref.index,
    key: ref.text,
    text: encode(ref.text, classes, ENCODED_LENGTH),
    sung: encode(ref.sung, classes, ENCODED_LENGTH),
  }));
}

/**
 * Rank every bhajan by how well its opening, as written or as sung, aligns to
 * the model's per-frame class log-probabilities (see ctc-score.ts).
 */
export function rankBySound(
  lp: Float32Array,
  frames: number,
  classes: SoundClasses,
  encoded: EncodedReference[],
  keep = 5,
): Ranking {
  if (frames === 0 || encoded.length === 0) {
    return { kind: "sound", candidates: [], margin: 0, queryLength: 0 };
  }
  // Nobody sings more than ~16 letters a second (frames are 20 ms), so the
  // rest of each bhajan cannot be in the clip and need not be aligned.
  const cap = Math.max(4, Math.ceil(frames / 3));
  const C = classes.count;
  const scored = encoded.map((ref) => {
    const ll = Math.max(
      prefixScore(lp, frames, C, ref.text.subarray(0, cap)),
      prefixScore(lp, frames, C, ref.sung.subarray(0, cap)),
    );
    return { ref, score: Math.exp(ll / frames) };
  });
  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  const rival = scored.find((s) => !sameLyrics(s.ref.key, best.ref.key));
  return {
    kind: "sound",
    candidates: scored.slice(0, keep).map((s) => ({ index: s.ref.index, score: s.score })),
    margin: rival ? best.score - rival.score : best.score,
    queryLength: frames,
  };
}

/**
 * Two catalog entries count as the same bhajan when their openings are within
 * this character error rate. Openings, not whole texts: duplicate entries tend
 * to differ by an extra verse or a written-out repeat, which a whole-text
 * comparison counts as a large difference.
 */
export const SAME_LYRICS_CER = 0.1;
const SAME_LYRICS_PREFIX = 100;

function sameLyrics(a: string, b: string): boolean {
  if (a === b) return true;
  const length = Math.min(a.length, b.length, SAME_LYRICS_PREFIX);
  return cer(a.slice(0, length), b.slice(0, length)) <= SAME_LYRICS_CER;
}

// --- combining ----------------------------------------------------------------

/**
 * Text and sound scoring fail differently: text throws away the model's
 * second guesses, sound is diluted by silent frames and drone. On degraded test
 * audio their sum separated the right bhajan from the best wrong one further
 * than either alone, so the app ranks by the sum.
 *
 * The scales differ (edit-distance fraction vs per-frame probability), so each
 * ranking is first turned into standard deviations above the mean over the
 * whole catalog. Both rankings must cover every bhajan (keep = Infinity).
 */
export function combine(text: Ranking, sound: Ranking, refs: Reference[], keep = 5): Ranking {
  const zt = standardise(text);
  const zs = standardise(sound);
  const summed = new Map<number, number>();
  for (const [index, z] of zs) summed.set(index, z + (zt.get(index) ?? 0));
  const scored = [...standardise({ candidates: [...summed].map(([index, score]) => ({ index, score })) })]
    .map(([index, score]) => ({ index, score }))
    .sort((a, b) => b.score - a.score);

  const textOf = new Map(refs.map((r) => [r.index, r.text]));
  const best = scored[0];
  const rival = best && scored.find((s) => !sameLyrics(textOf.get(s.index)!, textOf.get(best.index)!));
  return {
    kind: "combined",
    candidates: scored.slice(0, keep),
    margin: best && rival ? best.score - rival.score : 0,
    queryLength: Math.min(text.queryLength, sound.queryLength),
  };
}

function standardise(ranking: Pick<Ranking, "candidates">): Map<number, number> {
  const xs = ranking.candidates.map((c) => c.score);
  const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
  const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length || 1)) || 1;
  return new Map(ranking.candidates.map((c) => [c.index, (c.score - mean) / sd]));
}

// --- deciding ---------------------------------------------------------------

/**
 * When to look, and when to commit.
 *
 * The session waits for the first sung word, then checks at fixed moments
 * after it. Each check transcribes everything since the first word, so later
 * checks see strictly more of the opening. A check that is clear goes on
 * screen at once. If none is by `decideAfter`, one last check is made then and
 * whatever ranks first is shown: in live use the answer around 9–10 s was the
 * reliable one, and waiting longer cost more than it gained.
 *
 * The one exception is twins: two bhajans that share a first line ("Manasa
 * Bhajare Guru Charanam" is catalogued twice, with different second lines) and
 * only differ from line 2, which with the group's repeat of line 1 usually
 * arrives after 10 s. At 10 s the top answer between twins is a coin toss, so
 * when the runner-up is a twin of the leader over everything sung so far,
 * listening goes on, checking every 2 s, until the singing has gone past
 * where they part (see twinOf), and at `twinDecideAfter` at the latest.
 */
export const RULES = {
  /** Seconds after the first sung word at which to check for a clear winner. */
  checkpoints: [3, 5, 7, 9],
  /** Seconds after the first sung word at which the top answer is shown regardless... */
  decideAfter: 10,
  /** ...unless it has a twin; then these checks follow... */
  twinCheckpoints: [12, 14, 16, 18],
  /** ...and the top answer is shown regardless at this. */
  twinDecideAfter: 20,
  /** A transcript shorter than this fits too many bhajans by accident. */
  minQueryLength: 6,
  /** What counts as clear before `decideAfter`, for a text ranking. */
  clear: { score: 0.6, margin: 0.15 },
  /** ...and for a combined ranking: the lead over the next different bhajan, in σ. */
  clearCombined: { margin: 2 },
  /**
   * The least a leader must score to be shown at all. Every check ranks every
   * bhajan, so something always comes first, even for music or talking; on
   * test audio that was no bhajan, the leader never stood more than 4.1σ above
   * the catalog, while real matches almost always stand 5σ or more.
   */
  minMatch: { combined: 5, text: 0.5 },
};

export type Rules = typeof RULES;

/** Whether the leader is a real match, not merely the least bad of a thousand. */
export function isMatch(ranking: Ranking | null, rules: Rules = RULES): boolean {
  const top = ranking?.candidates[0];
  if (!ranking || !top) return false;
  return top.score >= (ranking.kind === "combined" ? rules.minMatch.combined : rules.minMatch.text);
}

export function isClear(ranking: Ranking | null, rules: Rules = RULES): boolean {
  const top = ranking?.candidates[0];
  if (!ranking || !top) return false;
  if (ranking.kind === "combined") return ranking.margin >= rules.clearCombined.margin;
  return (
    ranking.queryLength >= rules.minQueryLength &&
    top.score >= rules.clear.score &&
    ranking.margin >= rules.clear.margin
  );
}

// --- twins --------------------------------------------------------------------

/**
 * Two bhajans still count as twins until the singing has gone this many
 * characters past the end of their shared opening (about a second of singing),
 * so the ranking has heard some of the line that tells them apart.
 */
export const TWIN_LEAD = 10;
/**
 * Shortest shared opening that makes two bhajans twins: about a short line.
 * Less is a coincidence of a word or two, which the 10 s rule already handles.
 */
const MIN_TWIN_OPENING = 15;
/** Openings agree while their character error rate stays within this. */
const TWIN_CER = 0.1;
/** Openings are compared in steps of this many characters. */
const TWIN_STEP = 5;

/** How many characters two sung references share from the start, allowing small spelling differences. */
export function sharedOpening(a: string, b: string): number {
  let shared = 0;
  for (let n = TWIN_STEP; n <= Math.min(a.length, b.length); n += TWIN_STEP) {
    if (cer(a.slice(0, n), b.slice(0, n)) > TWIN_CER) break;
    shared = n;
  }
  return shared;
}

/**
 * The runner-up, if nothing sung so far can tell it from the leader: a
 * different bhajan (not a duplicate entry) whose sung opening matches the
 * leader's for at least as far as the singing has reached. `heard` is the
 * length of the transcript's match key, in the same characters as the
 * references. Null when the leader has no such twin.
 */
export function twinOf(ranking: Ranking, refs: Reference[], heard: number): number | null {
  const best = ranking.candidates[0];
  if (!best) return null;
  const refOf = new Map(refs.map((r) => [r.index, r]));
  const leader = refOf.get(best.index)!;
  const rival = ranking.candidates.find((c) => !sameLyrics(refOf.get(c.index)!.text, leader.text));
  if (!rival) return null;
  const shared = sharedOpening(leader.sung, refOf.get(rival.index)!.sung);
  return shared >= MIN_TWIN_OPENING && heard < shared + TWIN_LEAD ? rival.index : null;
}
