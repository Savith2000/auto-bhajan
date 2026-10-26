// Typed search over the catalog, for when the volunteer would rather type than
// listen (or the room is too loud). Runs entirely in the browser over the
// catalog already loaded; nothing is sent anywhere.
//
// Romanised bhajan spellings vary wildly ("Shyama" / "Shyaam", "Govinda" /
// "Gowinda", "Sai" / "Saayi"), so text is folded to a rough phonetic key before
// comparing. As a second net, the query is also turned into Devanagari and
// matched with the same normalisation the listener uses (matchKey), which
// forgives vowel length, aspiration, nasals and sibilants.

import { matchKey, type Bhajan, type Reference } from "./catalog.ts";
import { romanizedToDevanagari } from "./romanized.ts";

/** Lowercase, strip accents and punctuation, and fold common spelling variants. */
export function foldLatin(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // ā → a, ṃ → m
    .toLowerCase()
    .replace(/\[[^\]]*\]|\(\d+\)/g, " ") // singer cues and repeat counts
    .replace(/[^a-z\s]/g, " ")
    .replace(/w/g, "v")
    .replace(/([bcdgjkpt])h/g, "$1") // bh dh gh jh kh ph th ch → plain
    .replace(/sh/g, "s")
    .replace(/ee|ii/g, "i")
    .replace(/oo|uu/g, "u")
    .replace(/([a-z])\1+/g, "$1") // aa → a, mm → m
    .replace(/\s+/g, " ")
    .trim();
}

type Entry = {
  index: number;
  title: string;
  lyrics: string;
  /** Normalised Devanagari skeleton, from the listener's references. */
  sound: string;
};

export type SearchIndex = Entry[];

export function buildSearchIndex(catalog: Bhajan[], refs: Reference[]): SearchIndex {
  const sound = new Map(refs.map((r) => [r.index, r.text]));
  return catalog.map((bhajan, index) => ({
    index,
    title: foldLatin(bhajan.title),
    lyrics: foldLatin(bhajan.lyrics),
    sound: sound.get(index) ?? "",
  }));
}

export type SearchHit = { index: number; score: number };

/** Shortest Devanagari key worth matching on; shorter fits everything. */
const MIN_SOUND_KEY = 4;

/** Best matches first. Empty for an empty query. */
export function search(query: string, index: SearchIndex, limit = 20): SearchHit[] {
  const q = foldLatin(query);
  if (!q) return [];
  const words = q.split(" ");
  const has = (text: string) => words.every((w) => text.includes(w));
  const soundKey = matchKey(romanizedToDevanagari(query));
  const useSound = [...soundKey].length >= MIN_SOUND_KEY;

  const hits: SearchHit[] = [];
  for (const e of index) {
    let score = 0;
    if (e.title.startsWith(q)) score = 100;
    else if (e.title.includes(q)) score = 85;
    else if (has(e.title)) score = 70;
    else if (e.lyrics.includes(q)) score = 60;
    else if (has(e.lyrics)) score = 45;
    else if (useSound && e.sound.startsWith(soundKey)) score = 40;
    else if (useSound && e.sound.includes(soundKey)) score = 30;
    if (score) hits.push({ index: e.index, score });
  }
  // Ties: shorter titles first, so "Govinda" ranks the bhajan named just that
  // above every longer one that mentions it.
  hits.sort((a, b) => b.score - a.score || index[a.index].title.length - index[b.index].title.length);
  return hits.slice(0, limit);
}
