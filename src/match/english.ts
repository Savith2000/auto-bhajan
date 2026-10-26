// English lyrics → the Devanagari a Sanskrit speech model would write for them.
//
// The model cannot understand English, but it still hears the sounds and writes
// them in Devanagari: "love is my form" comes out something like "लव इज माइ
// फॉर्म". So an English bhajan can be matched like any other once its lyrics
// are spelled the way they *sound*. English spelling does not follow sound, so
// each word's pronunciation comes from a pronouncing dictionary (CMUdict,
// ARPAbet phonemes) and is mapped to Devanagari with the table below, which
// leans towards how Indian English is pronounced (t and d retroflex, "the" with
// a dental द).
//
// Like romanized.ts, this only has to be close *after normalisation*, which
// already ignores vowel length, aspiration and which nasal or sibilant.

import { romanizedToDevanagari } from "./romanized.ts";

/** ARPAbet consonant → Devanagari consonant. */
const CONSONANTS: Record<string, string> = {
  B: "ब", CH: "च", D: "ड", DH: "द", F: "फ", G: "ग", HH: "ह", JH: "ज", K: "क",
  L: "ल", M: "म", N: "न", NG: "ङ", P: "प", R: "र", S: "स", SH: "श", T: "ट",
  TH: "थ", V: "व", W: "व", Y: "य", Z: "ज", ZH: "ज",
};

/** ARPAbet vowel → [independent vowel, sign after a consonant]. */
const VOWELS: Record<string, [string, string]> = {
  AA: ["आ", "ा"], AE: ["ऐ", "ै"], AH: ["अ", ""], AO: ["ओ", "ो"], AW: ["आउ", "ाउ"],
  AY: ["आइ", "ाइ"], EH: ["ए", "े"], ER: ["अर", "र"], EY: ["ए", "े"], IH: ["इ", "ि"],
  IY: ["ई", "ी"], OW: ["ओ", "ो"], OY: ["ओय", "ोय"], UH: ["उ", "ु"], UW: ["ऊ", "ू"],
};

const VIRAMA = "्";

/** One word's ARPAbet phonemes (stress digits allowed) as Devanagari. */
export function phonemesToDevanagari(phonemes: string[]): string {
  let out = "";
  let afterConsonant = false;
  for (const raw of phonemes) {
    const p = raw.replace(/\d/g, "");
    const vowel = VOWELS[p];
    if (vowel) {
      out += afterConsonant ? vowel[1] : vowel[0];
      afterConsonant = false;
      continue;
    }
    const consonant = CONSONANTS[p];
    if (!consonant) continue;
    if (afterConsonant) out += VIRAMA;
    out += consonant;
    afterConsonant = true;
  }
  return out;
}

export type Pronouncer = (word: string) => string[] | undefined;

/**
 * Convert English lyrics line by line.
 *
 * `indian` returns the Devanagari for Indian words (Sai, Baba, Krishna…),
 * which the dictionary would give an English pronunciation ("Ram" as in the
 * animal), or undefined for English ones. Words in neither use the
 * romanised-Hindi rules.
 */
export function englishToDevanagari(
  lyrics: string,
  pronounce: Pronouncer,
  indian: (word: string) => string | undefined,
): string {
  return lyrics
    .toLowerCase()
    .split("\n")
    .map((line) =>
      (line.match(/[a-z']+/g) ?? [])
        .map((word) => {
          const native = indian(word);
          if (native) return native;
          const phonemes = lookup(word, pronounce);
          return phonemes ? phonemesToDevanagari(phonemes) : romanizedToDevanagari(word);
        })
        .join(" "),
    )
    .join("\n");
}

/** The word as written, then the spellings the catalog sometimes uses instead. */
function lookup(word: string, pronounce: Pronouncer): string[] | undefined {
  const variants = [
    word,
    word.replace(/au/g, "o"), // "praumised", "caume", "caumpassion"
    word.replace(/^dont$/, "don't"),
  ];
  for (const variant of variants) {
    const phonemes = pronounce(variant);
    if (phonemes) return phonemes;
  }
  return undefined;
}
