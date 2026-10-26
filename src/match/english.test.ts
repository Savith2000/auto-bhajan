import assert from "node:assert/strict";
import { test } from "node:test";

import { matchKey } from "./catalog.ts";
import { englishToDevanagari, phonemesToDevanagari } from "./english.ts";

const dictionary: Record<string, string[]> = {
  love: ["L", "AH1", "V"],
  is: ["IH1", "Z"],
  my: ["M", "AY1"],
  form: ["F", "AO1", "R", "M"],
  the: ["DH", "AH0"],
  promised: ["P", "R", "AA1", "M", "AH0", "S", "T"],
  ram: ["R", "AE1", "M"],
};
const pronounce = (w: string) => dictionary[w];
const spellings: Record<string, string> = { sai: "साई", ram: "राम" };
const indian = (w: string) => spellings[w];

test("phonemes become Devanagari syllables", () => {
  assert.equal(phonemesToDevanagari(["L", "AH1", "V"]), "लव");
  assert.equal(phonemesToDevanagari(["M", "AY1"]), "माइ");
  assert.equal(phonemesToDevanagari(["F", "AO1", "R", "M"]), "फोर्म");
});

test("lyrics are converted line by line", () => {
  assert.equal(englishToDevanagari("Love Is My Form,\nThe Form", pronounce, indian), "लव इज माइ फोर्म\nद फोर्म");
});

test("Indian words keep their Indian pronunciation", () => {
  // The dictionary would say "रैम", as in the animal.
  assert.equal(matchKey(englishToDevanagari("Ram", pronounce, indian)), matchKey("राम"));
});

test("catalog spellings like 'praumised' fall back to the usual spelling", () => {
  assert.equal(
    englishToDevanagari("praumised", pronounce, indian),
    englishToDevanagari("promised", pronounce, indian),
  );
});

test("words the dictionary lacks are spelled out", () => {
  assert.ok(englishToDevanagari("Prashanthi", pronounce, indian).length > 0);
});
