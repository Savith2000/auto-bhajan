// How alike are bhajan openings, with no model involved?
//
// Feeds each bhajan's own opening, as sung (every line twice, leader then
// group), cut to the first N normalised characters, i.e. a *perfect*
// transcript, to the matcher. Asks whether isClear() would commit, and whether
// it would commit to the right one. Anything ambiguous here is
// ambiguous before the model makes a single mistake, so it sets the ceiling
// and shows how much audio a decision really needs.
//
//   node eval/openings.ts [chars=15,30,60,90]

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { buildReferences, type Bhajan } from "../src/match/catalog.ts";
import { isClear, rank } from "../src/match/identify.ts";

const ROOT = join(import.meta.dirname, "..");
const catalog: Bhajan[] = JSON.parse(readFileSync(join(ROOT, "public", "catalog.json"), "utf8"));
const refs = buildReferences(catalog);
const lengths = (process.argv[2] ?? "15,30,60,90").split(",").map(Number);

for (const length of lengths) {
  let clear = 0;
  let wrong = 0;
  const ambiguous: string[] = [];
  for (const ref of refs) {
    if (ref.sung.length < length) continue;
    const ranking = rank(ref.sung.slice(0, length), refs);
    const top = ranking.candidates[0];
    if (!isClear(ranking)) {
      const rival = ranking.candidates.find((c) => c.index !== ref.index) ?? top;
      ambiguous.push(`${catalog[ref.index].title}  ~  ${catalog[rival.index].title}  (margin ${ranking.margin.toFixed(2)})`);
    } else if (top.index === ref.index || refs.find((r) => r.index === top.index)!.text === ref.text) {
      clear++;
    } else {
      wrong++;
      console.log(`  WRONG: ${catalog[ref.index].title} -> ${catalog[top.index].title}`);
    }
  }
  const total = clear + wrong + ambiguous.length;
  console.log(`\nfirst ${length} chars sung (~${Math.round(length / 4)} words): ${clear}/${total} clear, ${wrong} wrong, ${ambiguous.length} still waiting`);
  for (const line of ambiguous.slice(0, 8)) console.log(`  ${line}`);
}
