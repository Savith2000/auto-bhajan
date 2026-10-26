// Give the catalog's English bhajans a Devanagari spelling of how they sound,
// so the speech model can match them like any other (src/match/english.ts).
//
//   node scripts/english-devanagari.ts
//
// Runs after scripts/fetch_catalog.py (`npm run catalog` does both). Rewrites
// public/catalog.json in place, marking each converted entry with
// devanagariFrom: "english". The pronouncing dictionary (CMUdict, ~3.6 MB) is
// only needed here, at build time; it never reaches the browser.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { Bhajan } from "../src/match/catalog.ts";
import { englishToDevanagari } from "../src/match/english.ts";

const ROOT = join(import.meta.dirname, "..");
const CATALOG = join(ROOT, "public", "catalog.json");
const CMUDICT = join(ROOT, "data", "cmudict.dict");
const CMUDICT_URL = "https://raw.githubusercontent.com/cmusphinx/cmudict/master/cmudict.dict";
/**
 * A word is treated as Indian (Sai, Ram, Baba…) when it appears in at least
 * this share of the bhajans that have real Devanagari. Common English words
 * (the, my, love, lord) sit at or below 1%; the Indian names in the English
 * bhajans are at 2% and up.
 */
const INDIAN_SHARE = 0.02;
// Indian words, and words the dictionary lacks, are spelled the way the
// catalog's own Devanagari spells them where it can be learned (below), and by
// the romanised-Hindi rules otherwise.

if (!existsSync(CMUDICT)) {
  const response = await fetch(CMUDICT_URL);
  if (!response.ok) throw new Error(`CMUdict: HTTP ${response.status}`);
  writeFileSync(CMUDICT, await response.text());
}

const dictionary = new Map<string, string[]>();
for (const line of readFileSync(CMUDICT, "utf8").split("\n")) {
  const [word, ...phonemes] = line.split("#")[0].trim().split(/\s+/);
  // First pronunciation only; alternatives are written "word(2)".
  if (word && !word.includes("(") && !dictionary.has(word)) dictionary.set(word, phonemes);
}

const catalog: (Bhajan & { devanagariFrom?: string })[] = JSON.parse(readFileSync(CATALOG, "utf8"));
const words = (text: string) => new Set(text.toLowerCase().match(/[a-z']+/g) ?? []);

const native = catalog.filter((b) => b.devanagari.trim() && b.devanagariFrom !== "english");
const share = new Map<string, number>();
for (const bhajan of native) {
  for (const word of words(bhajan.lyrics)) share.set(word, (share.get(word) ?? 0) + 1 / native.length);
}

// How the catalog itself writes each romanised word in Devanagari, learned from
// bhajans whose romanised and Devanagari lyrics line up word for word.
const seen = new Map<string, Map<string, number>>();
const lines = (text: string) =>
  text.replace(/\[[^\]]*\]/g, " ").replace(/\(\d+\)/g, " ").split("\n").map((l) => l.trim()).filter(Boolean);
for (const bhajan of native) {
  const latin = lines(bhajan.lyrics);
  const deva = lines(bhajan.devanagari);
  if (latin.length !== deva.length) continue;
  latin.forEach((line, i) => {
    const l = line.toLowerCase().match(/[a-z']+/g) ?? [];
    const d = deva[i].match(/[\u0900-\u097F]+/g) ?? [];
    if (l.length !== d.length) return;
    l.forEach((word, j) => {
      const counts = seen.get(word) ?? new Map<string, number>();
      counts.set(d[j], (counts.get(d[j]) ?? 0) + 1);
      seen.set(word, counts);
    });
  });
}
const spelling = (word: string) => {
  const counts = seen.get(word);
  return counts && [...counts].sort((a, b) => b[1] - a[1])[0][0];
};
const indian = (word: string) =>
  (share.get(word) ?? 0) >= INDIAN_SHARE || !dictionary.has(word) ? spelling(word) : undefined;

let converted = 0;
for (const bhajan of catalog) {
  const needs = bhajan.devanagariFrom === "english" || !bhajan.devanagari.trim();
  if (!needs || !bhajan.language.includes("English")) continue;
  bhajan.devanagari = englishToDevanagari(
    bhajan.lyrics.replace(/\[[^\]]*\]/g, " "),
    (word) => dictionary.get(word),
    indian,
  );
  bhajan.devanagariFrom = "english";
  converted++;
}

writeFileSync(CATALOG, JSON.stringify(catalog));
console.log(`gave ${converted} English bhajans a Devanagari spelling`);
for (const bhajan of catalog.filter((b) => b.devanagariFrom === "english").slice(0, 3)) {
  console.log(`  ${bhajan.lyrics.split("\n")[0]}\n  ${bhajan.devanagari.split("\n")[0]}`);
}
