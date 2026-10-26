// Offline accuracy test, step 2 of 2: would the app have shown the right bhajan?
//
// Replays the cached checkpoint transcripts from eval/transcribe.ts through the
// app's own rank() and isClear(), exactly as the listening session does: the
// first clear checkpoint goes on screen, and failing that, the top answer at
// RULES.decideAfter, or later if it has a twin (see twinOf). Transcripts made
// before the twin checks existed stop at decideAfter, which then answers.
//
//   node eval/score.ts            summary + every miss
//   node eval/score.ts --verbose  also every hit
//   node eval/score.ts --text     rank by the greedy transcript only (the old way)
//   node eval/score.ts --set name transcripts made with transcribe --set name
//
// The number that matters most is WRONG: a confident wrong answer on screen.
// Offering choices is a far smaller failure.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildReferences, matchKey, type Bhajan } from "../src/match/catalog.ts";
import { classLogProbs, soundClasses } from "../src/match/ctc-score.ts";
import { combine, encodeReferences, isClear, isMatch, rank, rankBySound, RULES, twinOf, type Ranking } from "../src/match/identify.ts";
import type { Transcript } from "./transcribe.ts";

const ROOT = join(import.meta.dirname, "..");
const verbose = process.argv.includes("--verbose");
const byText = process.argv.includes("--text");

const catalog: Bhajan[] = JSON.parse(readFileSync(join(ROOT, "public", "catalog.json"), "utf8"));
const refs = buildReferences(catalog);
const indexOf = new Map(catalog.map((b, i) => [b.slug, i]));
const refText = new Map(refs.map((r) => [r.index, r.text]));

const setArg = process.argv.indexOf("--set");
const dir = join(ROOT, "eval", "transcripts", setArg > 0 ? process.argv[setArg + 1] : "");
const transcripts: Transcript[] = readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));

type Outcome = {
  slug: string;
  result: "right" | "wrong" | "choices" | "no singing";
  at: number | null;
  chosen: number | null;
  /** Was the right answer among the 3 choices offered? */
  inTop3: boolean;
  ranking: Ranking | null;
};

const outcomes: Outcome[] = [];
for (const transcript of transcripts) {
  const truth = indexOf.get(transcript.slug)!;
  // A bhajan catalogued twice with the same words counts as right either way.
  const isRight = (index: number) => refText.get(index) === refText.get(truth);
  let last: Ranking | null = null;
  let outcome: Outcome | null = null;

  const classes = soundClasses(transcript.tokens, transcript.blankId);
  const encoded = encodeReferences(refs, classes);
  for (const check of transcript.checks) {
    const query = matchKey(check.text);
    const byWords = query ? rank(query, refs, { keep: byText ? 5 : Infinity }) : null;
    let ranking: Ranking | null = byWords;
    if (!byText && byWords) {
      const bytes = Buffer.from(check.logits, "base64");
      const logits = new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4);
      const lp = classLogProbs(logits, check.frames, logits.length / check.frames, classes);
      ranking = combine(byWords, rankBySound(lp, check.frames, classes, encoded, Infinity), refs);
    }
    if (ranking) last = ranking;
    const final = check === transcript.checks.at(-1) || check.at === RULES.twinDecideAfter;
    const deciding = check.at >= RULES.decideAfter;
    const real = isMatch(ranking);
    const twin = real && deciding && !final && !isClear(ranking) ? twinOf(ranking!, refs, [...query].length) : null;
    if (ranking && real && (isClear(ranking) || (deciding && twin === null))) {
      const chosen = ranking.candidates[0].index;
      outcome = {
        slug: transcript.slug,
        result: isRight(chosen) ? "right" : "wrong",
        at: check.at,
        chosen,
        inTop3: ranking.candidates.slice(0, 3).some((c) => isRight(c.index)),
        ranking,
      };
      break;
    }
    // No real match by decideAfter: the app forgets these words and waits for
    // more, which a cached transcript can't replay, so it counts as no answer.
    if (deciding && !real) break;
  }
  outcome ??= {
    slug: transcript.slug,
    result: transcript.onsetSeconds === null ? "no singing" : "choices",
    at: null,
    chosen: null,
    inTop3: !!last?.candidates.slice(0, 3).some((c) => isRight(c.index)),
    ranking: last,
  };
  outcomes.push(outcome);
}

const n = outcomes.length;
const by = (r: Outcome["result"]) => outcomes.filter((o) => o.result === r);
const pct = (k: number) => `${k}/${n} (${((100 * k) / n).toFixed(0)}%)`;
const when = new Map<number, number>();
for (const o of by("right")) when.set(o.at!, (when.get(o.at!) ?? 0) + 1);

console.log(`ranked by ${byText ? "text only (greedy transcript)" : "text + sound combined"}\n`);
console.log(`right       ${pct(by("right").length)}   decided at: ${[...when].sort((a, b) => a[0] - b[0]).map(([t, k]) => `${t}s×${k}`).join(" ")}`);
console.log(`wrong       ${pct(by("wrong").length)}   <- a confident wrong answer on screen`);
console.log(`no answer   ${pct(by("choices").length)}   (right one among the top 3 for ${by("choices").filter((o) => o.inTop3).length})`);
console.log(`no singing  ${pct(by("no singing").length)}`);

const title = (i: number | null | undefined) => (i == null ? "-" : catalog[i].title);
for (const o of outcomes) {
  if (o.result === "right" && !verbose) continue;
  const top = o.ranking?.candidates.slice(0, 3).map((c) => `${title(c.index)} ${c.score.toFixed(2)}`).join(" | ");
  console.log(
    `\n[${o.result}${o.at ? ` @${o.at}s` : ""}] ${title(indexOf.get(o.slug))}` +
      (o.result === "wrong" ? `\n    showed: ${title(o.chosen)}` : "") +
      `\n    top 3: ${top ?? "(no transcript)"}   margin ${o.ranking?.margin.toFixed(2) ?? "-"}`,
  );
}
