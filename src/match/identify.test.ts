import assert from "node:assert/strict";
import { test } from "node:test";

import { makeReference, matchKey, stripRepeatCues, type Reference } from "./catalog.ts";
import { alignDistance, isClear, isMatch, rank, sharedOpening, twinOf, type Ranking } from "./identify.ts";

const refs: Reference[] = [
  "प्रेम से बोलो एक बार साईं राम\nबोलो राम साईं राम [ प्रेम से ... ]\nमधुर मनोहर राम",
  "गोविंद गोपाल प्रभु गिरिधारी\nजमुना तट पर रास रचाए",
  "प्रेम मुदित मन से कहो राम राम राम\nश्री राम राम राम",
  "प्रेम मुदित मन से कहो राम राम राम\nश्री राम राम राम",
  "नमः पार्वती पतये हर हर\nहर हर हर हर महादेव",
  "हर हर हर हर महादेव\nशिव शिव शंकर",
  "गोविंद गोपाल प्रभु दयाला\nदीन दयाला",
  "गोविन्द कृष्ण विट्ठले वेणु गोपाल कृष्ण विट्ठले\nरंगा रंगा विट्ठले श्री पांडुरंग विट्ठले",
  "गोविन्द कृष्ण विट्ठला वेणु गोपाला कृष्ण विट्ठला\nपांडुरंग विट्ठला जय पंढरी नाथ विट्ठला",
].map((text, index) => makeReference(index, text));

test("repeat cues are removed before matching", () => {
  assert.equal(stripRepeatCues("बोलो राम [ प्रेम से ... ]").trim(), "बोलो राम");
});

test("alignment is anchored to the opening, with a little slack", () => {
  assert.equal(alignDistance("abc", "abcdef"), 0);
  assert.equal(alignDistance("bcd", "abcdef"), 0, "a swallowed first character is free");
  assert.ok(alignDistance("ijk", "abcdefghijk") >= 3, "starting deep inside costs");
  assert.equal(alignDistance("ijk", "abcdefghijk", Infinity), 0, "free start when asked");
  assert.equal(alignDistance("abc", ""), 3);
});

test("a mangled transcript still lands on the right bhajan", () => {
  // Wrong sibilant, lost vowel length, extra spaces: all normalised away.
  const ranking = rank(matchKey("परेम से बोलो एक बर साई राम"), refs);
  assert.equal(ranking.candidates[0].index, 0);
  assert.ok(ranking.candidates[0].score > 0.8);
});

test("a phrase from another bhajan's middle does not win over its own opening", () => {
  // "हर हर हर हर महादेव" is line 2 of bhajan 4 and line 1 of bhajan 5.
  const ranking = rank(matchKey("हर हर हर हर महादेव"), refs);
  assert.equal(ranking.candidates[0].index, 5);
  assert.ok(isClear(ranking), `margin ${ranking.margin}`);
});

test("identical lyrics catalogued twice do not count as ambiguity", () => {
  const ranking = rank(matchKey("प्रेम मुदित मन से कहो राम राम राम"), refs);
  assert.ok([2, 3].includes(ranking.candidates[0].index));
  assert.ok(ranking.margin > 0.2, `margin ${ranking.margin}`);
});

test("word-final viramas the model adds do not cost anything", () => {
  assert.equal(matchKey("प्रेम्से बोलो एक्बार्"), matchKey("प्रेम से बोलो एक बार"));
});

test("a clear opening is clear", () => {
  assert.ok(isClear(rank(matchKey("प्रेम से बोलो एक बार साईं राम"), refs)));
});

test("too little transcript is never clear", () => {
  assert.equal(isClear(rank(matchKey("प्रे"), refs)), false);
});

test("two bhajans that open alike are not clear until they diverge", () => {
  // Bhajans 1 and 6 share "गोविंद गोपाल प्रभु" and only then diverge.
  assert.equal(isClear(rank(matchKey("गोविंद गोपाल प्रभु"), refs)), false);
  assert.ok(isClear(rank(matchKey("गोविंद गोपाल प्रभु गिरिधारी"), refs)));
});

test("a shared first line, sung twice, is told apart by the second line", () => {
  const line1 = "गोविन्द कृष्ण विट्ठले वेणु गोपाल कृष्ण विट्ठले";
  // Leader, then group, then the start of line 2.
  const atRepeat = rank(matchKey(`${line1} ${line1}`), refs);
  assert.equal(isClear(atRepeat), false, "line 1 alone cannot separate them");
  const atLine2 = rank(matchKey(`${line1} ${line1} रंगा रंगा विट्ठले श्री पांडुरंग`), refs);
  assert.equal(atLine2.candidates[0].index, 7);
  assert.ok(isClear(atLine2), `margin ${atLine2.margin}`);
});

// "Manasa Bhajare Guru Charanam" is catalogued twice with different second lines.
const twins: Reference[] = [
  "मानस भजोरॆ गुरु चरणम्\nसाई चरणम् प्रणमाम्यहम्\nनिर्मल हृदय विराजित चरणम्",
  "मानस भजो रे गुरु चरणम्\nदुस्तर भव सागर तरणम्\nगुरु महाराज गुरु जय जय",
  "प्रेम से बोलो एक बार साईं राम\nमधुर मनोहर राम",
].map((text, index) => makeReference(index, text));
const heard = (text: string) => {
  const query = matchKey(text);
  return twinOf(rank(query, twins), twins, [...query].length);
};

test("bhajans that share a first line share an opening that long, and no longer", () => {
  const line = [...matchKey("मानस भजो रे गुरु चरणम्")].length;
  const shared = sharedOpening(twins[0].sung, twins[1].sung);
  assert.ok(shared >= line, `${shared} < ${line}`);
  assert.ok(shared < 2 * line + 10, `${shared}`);
  assert.equal(sharedOpening(twins[0].sung, twins[2].sung), 0);
});

test("while only the shared line has been sung, the leader has a twin", () => {
  assert.notEqual(heard("मानस भजो रे गुरु चरणम् मानस भजो रे गुरु चरणम्"), null);
});

test("once the next line is under way, the twin is resolved", () => {
  const sung = "मानस भजो रे गुरु चरणम् मानस भजो रे गुरु चरणम्";
  assert.equal(heard(`${sung} दुस्तर भव सागर तरणम्`), null);
  assert.equal(heard(`${sung} साई चरणम् प्रणमाम्यहम्`), null);
});

test("a bhajan nothing else opens like has no twin", () => {
  assert.equal(heard("प्रेम से बोलो एक बार साईं राम"), null);
});

test("a duplicate entry with the same lyrics is not a twin", () => {
  const copies = [twins[2], { ...twins[2], index: 3 }, twins[0]];
  const query = matchKey("प्रेम से बोलो");
  assert.equal(twinOf(rank(query, copies), copies, [...query].length), null);
});

const combined = (top: number): Ranking => ({
  kind: "combined",
  candidates: [{ index: 0, score: top }, { index: 1, score: 1 }],
  margin: top - 1,
  queryLength: 20,
});

test("only a leader that stands well out of the catalog is a match", () => {
  // No bhajan at all still ranks something first, at about 3-4σ.
  assert.equal(isMatch(combined(4)), false);
  assert.equal(isMatch(combined(8)), true);
  assert.equal(isMatch(null), false);
});
