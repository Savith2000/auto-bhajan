import assert from "node:assert/strict";
import { test } from "node:test";

import type { Vocab } from "../asr/ctc.ts";
import { firstWordFrame, frameSample } from "./words.ts";

const vocab: Vocab = { tokens: ["<s>", "|", "म", "ा", "न", "स"], blankId: 0 };

test("music, which the model leaves blank, is not words", () => {
  assert.equal(firstWordFrame(new Array(200).fill(0), vocab), null);
});

test("words begin at the first letter", () => {
  assert.equal(firstWordFrame([0, 0, 0, 2, 2, 3, 0, 4, 1, 5, 0], vocab), 3);
});

test("a stray letter or two is not words", () => {
  assert.equal(firstWordFrame([0, 0, 2, 0, 0, 1, 0, 3, 0], vocab), null);
});

test("a letter held over several frames counts once, word breaks not at all", () => {
  assert.equal(firstWordFrame([2, 2, 2, 2, 1, 1, 3, 3], vocab), null);
  assert.equal(firstWordFrame([2, 2, 0, 2, 1, 3, 0, 3], vocab), 0, "the same letter twice, split by a blank, is two");
});

test("a look's frame is placed in the press's timeline", () => {
  // A 4 s look starting 6 s after the press, 200 frames: frame 150 is 3 s in.
  assert.equal(frameSample(96_000, 64_000, 200, 150), 96_000 + 48_000);
});
