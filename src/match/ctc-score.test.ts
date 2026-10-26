import assert from "node:assert/strict";
import { test } from "node:test";

import { matchKey } from "./catalog.ts";
import { classLogProbs, encode, prefixScore, soundClasses } from "./ctc-score.ts";

// A toy vocabulary in the model's layout: blank first, special tokens skipped.
const tokens = ["<s>", "<pad>", "|", "र", "ा", "म", "स", "श", "ई", "ि", "इ"];
const classes = soundClasses(tokens, 0);
const id = (t: string) => tokens.indexOf(t);

/** Logits that put almost all probability on one token per frame. */
function framesOf(sequence: string[]): { logits: Float32Array; frames: number } {
  const V = tokens.length;
  const logits = new Float32Array(sequence.length * V).fill(-10);
  sequence.forEach((t, f) => (logits[f * V + id(t)] = 10));
  return { logits, frames: sequence.length };
}

function score(sequence: string[], reference: string): number {
  const { logits, frames } = framesOf(sequence);
  const lp = classLogProbs(logits, frames, tokens.length, classes);
  return prefixScore(lp, frames, classes.count, encode(matchKey(reference), classes));
}

test("tokens fold into the normaliser's classes", () => {
  assert.equal(classes.ofToken[id("श")], classes.ofToken[id("स")], "sibilants merge");
  assert.equal(classes.ofToken[id("म")], classes.ofChar.get("न"), "म is a nasal");
  assert.equal(classes.ofToken[id("ई")], classes.ofChar.get("इ"), "vowel length merges");
  assert.equal(classes.ofToken[id("ा")], 0, "deleted signs join the blank");
  assert.equal(classes.ofToken[id("|")], 0, "the word separator joins the blank");
  assert.equal(classes.ofToken[id("<pad>")], -1);
});

test("the words actually sung outscore other words", () => {
  const heard = ["<s>", "र", "<s>", "म", "म", "<s>", "स", "ि"];
  assert.ok(score(heard, "राम सी") > score(heard, "सीता राम") + 10);
});

test("audio covering only the opening still scores its bhajan well", () => {
  const heard = ["<s>", "र", "र", "<s>", "म", "<s>"];
  const opening = score(heard, "राम");
  const longer = score(heard, "राम सीता राम सीता राम");
  assert.ok(Math.abs(opening - longer) < 1e-3, `${opening} vs ${longer}`);
});

test("a swallowed first letter is forgiven, starting mid-song is not", () => {
  const heard = ["<s>", "म", "म", "<s>", "स", "ि", "<s>"];
  assert.ok(score(heard, "रमसि") > -1, "skipping one letter is free");
  assert.ok(score(heard, "ससससरमसि") < score(heard, "रमसि") - 10);
});

test("a doubtful frame keeps its second guess", () => {
  // Frame 2 is 55% म, 45% स: the greedy transcript says म, but a reference
  // that needs स there loses only a little.
  const V = tokens.length;
  const { logits } = framesOf(["<s>", "र", "म", "<s>"]);
  logits[2 * V + id("स")] = 10 + Math.log(45 / 55);
  const lp = classLogProbs(logits, 4, V, classes);
  const s = prefixScore(lp, 4, classes.count, encode(matchKey("रस"), classes));
  assert.ok(s > -2, `score ${s}`);
});
