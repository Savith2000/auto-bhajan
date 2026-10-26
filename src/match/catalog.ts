// The bhajan catalog as the matcher sees it.
//
// public/catalog.json is written by scripts/fetch_catalog.py. Each entry keeps
// the text people read (title, romanised lyrics, meaning) next to the
// Devanagari the speech model is compared against. Nobody ever sees the
// Devanagari; it is only the matching side.

import { normalize } from "./normalize.ts";
import { romanizedToDevanagari } from "./romanized.ts";

export type Bhajan = {
  slug: string;
  title: string;
  deity: string[];
  language: string[];
  /** Romanised lyrics: what goes on screen. */
  lyrics: string;
  /** English translation of the meaning. */
  meaning: string;
  /** Recommended keys, e.g. "2 P" (gents) and "6 P" (ladies); may be empty. */
  gentsPitch?: string;
  ladiesPitch?: string;
  /** Devanagari lyrics: what the model's output is matched against. */
  devanagari: string;
  /** IAST-style respelling. */
  respell: string;
  /**
   * "english": the catalog had no Devanagari, so scripts/english-devanagari.ts
   * spelled out how the English lyrics sound.
   */
  devanagariFrom?: "english";
};

export type Reference = {
  /** Index into the catalog array. */
  index: number;
  /** Normalised Devanagari skeleton of the whole bhajan, as written. */
  text: string;
  /**
   * The same with every line twice, as it is actually sung: the leader sings
   * a line and the group sings it back. Without this, a clip that has reached
   * the group's repeat of line 1 matches no bhajan well, and two bhajans that
   * share a first line can never be told apart by their second.
   */
  sung: string;
};

/**
 * Drop the repeat cues the catalog writes inline, e.g. "[ प्रेम से ... ]".
 *
 * They are instructions to the singer, not words, and the abbreviated phrase
 * inside them would otherwise be matched as if it were sung right there.
 */
export function stripRepeatCues(text: string): string {
  return text.replace(/\[[^\]]*\]/g, " ");
}

/**
 * voice-seva's normaliser, plus one rule for sung Hindi: drop every virama.
 *
 * The model marks nearly every word-final consonant dead ("प्रेम्सि …
 * एक्बार्"), while the catalog writes those words the Hindi way with no
 * virama at all ("प्रेम से एक बार"). That one mark cost ~0.15 of score on the
 * right bhajan in the first tests. It is applied here rather than in
 * normalize.ts so that file stays identical to voice-seva's, which is pinned
 * against a Python fixture.
 */
export function matchKey(text: string): string {
  return normalize(text).replace(/\u094D/g, "");
}

function lineKeys(text: string): string[] {
  return stripRepeatCues(text).split("\n").map(matchKey).filter(Boolean);
}

export function referenceText(devanagari: string): string {
  return lineKeys(devanagari).join("");
}

export function makeReference(index: number, devanagari: string): Reference {
  const lines = lineKeys(devanagari);
  return { index, text: lines.join(""), sung: lines.flatMap((l) => [l, l]).join("") };
}

/**
 * What the model's output is compared against, for every bhajan it can hear.
 *
 * A few dozen bhajans have no Devanagari in the catalog, only romanised
 * lyrics; those get a rough conversion (src/match/romanized.ts). English
 * bhajans get theirs at build time from scripts/english-devanagari.ts; one that
 * somehow still has none is left out, since romanised-Hindi rules would spell
 * English nonsensically.
 */
export function buildReferences(catalog: Bhajan[]): Reference[] {
  const refs: Reference[] = [];
  catalog.forEach((bhajan, index) => {
    let devanagari = bhajan.devanagari;
    if (!referenceText(devanagari) && !isEnglishOnly(bhajan)) {
      devanagari = romanizedToDevanagari(stripRepeatCues(bhajan.lyrics));
    }
    const ref = makeReference(index, devanagari);
    if (ref.text) refs.push(ref);
  });
  return refs;
}

function isEnglishOnly(bhajan: Bhajan): boolean {
  return bhajan.language.length > 0 && bhajan.language.every((l) => l === "English");
}
