import assert from "node:assert/strict";
import { test } from "node:test";

import { makeReference, type Bhajan } from "./catalog.ts";
import { buildSearchIndex, foldLatin, search } from "./search.ts";

const bhajan = (title: string, lyrics: string, devanagari = ""): Bhajan => ({
  slug: title.toLowerCase().replace(/\s+/g, "-"),
  title,
  deity: [],
  language: [],
  lyrics,
  meaning: "",
  devanagari,
  respell: "",
});

const catalog = [
  bhajan("Hey Shyama Sundara Hey Sai Sundara", "Hey Shyama Sundara Hey Sai Sundara\nParthipureeshwara Hey Sai Sundara", "हे श्यामा सुंदरा हे साई सुंदरा"),
  bhajan("Govinda Krishna Vitthale", "Govinda Krishna Vitthale Venu Gopala", "गोविन्द कृष्ण विट्ठले वेणु गोपाल"),
  bhajan("Govinda", "Govinda Govinda Gopala", "गोविन्द गोविन्द गोपाल"),
  bhajan("Prem Se Bolo Ek Bar Sai Ram", "Prem Se Bolo Ek Bar Sai Ram\nMadhura Manohara Ram", "प्रेम से बोलो एक बार साईं राम"),
];
const refs = catalog.map((b, i) => makeReference(i, b.devanagari));
const index = buildSearchIndex(catalog, refs);
const titles = (q: string) => search(q, index).map((h) => catalog[h.index].title);

test("folding forgives accents, doubled letters and common spelling swaps", () => {
  assert.equal(foldLatin("Shyaama"), foldLatin("Shyama"));
  assert.equal(foldLatin("Gowinda"), foldLatin("Govinda"));
  assert.equal(foldLatin("Parthipureeshwara"), foldLatin("Parthipurishvara"));
  assert.equal(foldLatin("Sāīṃ Rām"), "saim ram");
});

test("title prefix ranks first, and shorter titles win ties", () => {
  assert.deepEqual(titles("govinda").slice(0, 2), ["Govinda", "Govinda Krishna Vitthale"]);
});

test("any line of the lyrics finds its bhajan", () => {
  assert.deepEqual(titles("madhura manohara"), ["Prem Se Bolo Ek Bar Sai Ram"]);
  assert.deepEqual(titles("parthipurishvara"), ["Hey Shyama Sundara Hey Sai Sundara"]);
});

test("words can come in any order within a title", () => {
  assert.deepEqual(titles("sundara shyama"), ["Hey Shyama Sundara Hey Sai Sundara"]);
});

test("a sound-alike spelling still matches through Devanagari", () => {
  assert.ok(titles("prem se bolo").includes("Prem Se Bolo Ek Bar Sai Ram"));
  assert.ok(titles("prema se bolo").includes("Prem Se Bolo Ek Bar Sai Ram"), titles("prema se bolo").join());
});

test("an empty query finds nothing", () => {
  assert.deepEqual(search("   ", index), []);
});
