import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { buildReferences, matchKey, stripRepeatCues, type Bhajan } from "../match/catalog.ts";
import { rank } from "../match/identify.ts";
import { bhajanEnded, FOLLOW, judgeNext, lookEvery, strayCount, wordlessSince } from "./follow.ts";

const RATE = 16_000;

// --- the end of a bhajan --------------------------------------------------------

/**
 * Looks as the session makes them while following: every 2 s, over the last
 * 4 s. `sung` is the stretches with words, in seconds. Returns when the
 * bhajan was taken to have ended, in seconds, or null.
 */
function endedAt(sung: [number, number][], until: number): number | null {
  let since: number | null = null;
  const every = FOLLOW.everySamples / RATE;
  const window = 4;
  for (let now = every; now <= until; now += every) {
    const start = Math.max(0, now - window);
    const words = sung.some(([a, b]) => a < now && b > start);
    since = wordlessSince(since, start * RATE, words);
    if (bhajanEnded(since, now * RATE)) return now;
  }
  return null;
}

test("words in a look end the stretch without them", () => {
  assert.equal(wordlessSince(null, 1000, false), 1000);
  assert.equal(wordlessSince(1000, 33_000, false), 1000, "dated from the first wordless look");
  assert.equal(wordlessSince(1000, 65_000, true), null);
});

test("a pause between lines, however long a breath, is not the end", () => {
  // A line every few seconds, with the longest pause 4.5 s.
  const sung: [number, number][] = [[0, 6], [7, 10], [14.5, 20], [21, 30]];
  assert.equal(endedAt(sung, 30), null);
});

test("six seconds without words is the end", () => {
  const ended = endedAt([[0, 10]], 30);
  assert.equal(ended, 16, "two wordless looks, the second 6 s after the first one's window began");
});

test("nothing ends before a wordless look", () => {
  assert.equal(bhajanEnded(null, 10 * RATE), false);
  assert.equal(bhajanEnded(0, 4.9 * RATE), false);
  assert.equal(bhajanEnded(0, 5 * RATE), true);
});

// --- the cost of following ------------------------------------------------------

test("looks are spaced out on a slow device, and come back when it is fast again", () => {
  assert.equal(lookEvery(100), FOLLOW.everySamples, "cheap: every 2 s");
  assert.equal(lookEvery(500), FOLLOW.everySamples, "a quarter of 2 s is still fine");
  assert.equal(lookEvery(1000), 4 * RATE, "1 s a look: every 4 s");
  assert.equal(lookEvery(5000), FOLLOW.slowestEverySamples, "never more than 6 s apart");
  assert.equal(lookEvery(80), FOLLOW.everySamples);
});

// --- the next bhajan, against the real catalog ------------------------------------

const catalog: Bhajan[] = JSON.parse(readFileSync(new URL("../../public/catalog.json", import.meta.url), "utf8"));
const refs = buildReferences(catalog);
const byTitle = (title: string) => {
  const index = catalog.findIndex((b) => b.title === title);
  assert.ok(index >= 0, title);
  return refs.find((r) => r.index === index)!;
};
const lines = (title: string) =>
  stripRepeatCues(catalog[byTitle(title).index].devanagari)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/** What the session decides after hearing `sung` while `onScreen` is showing, if the words lead to `leader`. */
function judge(onScreen: string, sung: string, leader?: string) {
  const query = matchKey(sung);
  const byText = rank(query, refs, { keep: Infinity });
  const current = byTitle(onScreen);
  // The leader the opening-anchored ranking would answer with, other than the bhajan on screen.
  const rival = byText.candidates.find((c) => c.index !== current.index)!;
  const top = leader ? byTitle(leader) : refs.find((r) => r.index === rival.index)!;
  return judgeNext(current, top, query, byText);
}

test("a line from deep inside the bhajan on screen does not switch", () => {
  // Line 4 of "Atma Rama Ananda Ramana", sung twice and into line 5, after a pause.
  const atma = lines("Atma Rama Ananda Ramana");
  assert.equal(judge("Atma Rama Ananda Ramana", `${atma[3]} ${atma[3]} ${atma[4]}`), "veto");
  const shyama = lines("Bhaja Mana Shyama Sundara Giridhari");
  assert.equal(judge("Bhaja Mana Shyama Sundara Giridhari", `${shyama[1]} ${shyama[1]}`), "veto");
});

test("a line that is also another bhajan's opening does not switch either", () => {
  // The last line of "Baba Aao Mere Keertan Mein" is the first of "Jeevan Jyoti Tum Ho Sai":
  // the words fit both perfectly, so it stays, and the volunteer can tap if it was the next one.
  const baba = lines("Baba Aao Mere Keertan Mein");
  assert.equal(judge("Baba Aao Mere Keertan Mein", `${baba[4]} ${baba[4]}`, "Jeevan Jyoti Tum Ho Sai"), "veto");
});

test("the next bhajan's real opening switches", () => {
  const murali = lines("Murali Manohara Shyama Murari");
  assert.equal(judge("Hara Shiva Shankara Bhole Nath Shirdi Pureeshwara Sai Nath", `${murali[0]} ${murali[0]}`), "switch");
});

test("an opening that is a line of the bhajan on screen switches once it goes past that line", () => {
  // "Raghukula Bhushana Rajeeva Nayana" opens with line 4 of "Atma Rama Ananda Ramana",
  // then goes on differently.
  const raghu = lines("Raghukula Bhushana Rajeeva Nayana");
  assert.equal(
    judge("Atma Rama Ananda Ramana", `${raghu[0]} ${raghu[0]} ${raghu[1]}`, "Raghukula Bhushana Rajeeva Nayana"),
    "switch",
  );
});

test("the same bhajan, or the same lyrics catalogued twice, is no switch", () => {
  const bolo = lines("Bolo Ram Sai Ram Sathya Sai Ram");
  assert.equal(judge("Bolo Ram Sai Ram Sathya Sai Ram", `${bolo[0]} ${bolo[0]}`, "Bolo Ram, Sai Ram"), "same");
  assert.equal(judge("Bolo Ram Sai Ram Sathya Sai Ram", bolo[0], "Bolo Ram Sai Ram Sathya Sai Ram"), "same");
});

test("with nothing to compare against, only a strong opening switches", () => {
  const murali = byTitle("Murali Manohara Shyama Murari");
  const query = matchKey(lines("Murali Manohara Shyama Murari")[0]);
  assert.equal(judgeNext(undefined, murali, query, null), "switch", "scored on the spot without a ranking");
  assert.equal(judgeNext(undefined, murali, "", null), "veto");
});

// --- the next bhajan with no pause ------------------------------------------------

test("lines of the bhajan on screen never count as straying", () => {
  const atma = lines("Atma Rama Ananda Ramana");
  const current = byTitle("Atma Rama Ananda Ramana");
  for (const line of atma) assert.equal(strayCount(1, current, matchKey(`${line} ${line}`)), 0, line);
});

test("another bhajan's words stray, and the count runs while they keep coming", () => {
  const current = byTitle("Hara Shiva Shankara Bhole Nath Shirdi Pureeshwara Sai Nath");
  const murali = matchKey(lines("Murali Manohara Shyama Murari")[0]);
  assert.equal(strayCount(0, current, murali), 1);
  assert.equal(strayCount(1, current, murali), FOLLOW.strayLooks);
});

test("no words, or too few to judge, start the count again", () => {
  const current = byTitle("Atma Rama Ananda Ramana");
  assert.equal(strayCount(1, current, ""), 0);
  assert.equal(strayCount(1, current, matchKey("राम")), 0);
  assert.equal(strayCount(1, undefined, matchKey(lines("Murali Manohara Shyama Murari")[0])), 0);
});
