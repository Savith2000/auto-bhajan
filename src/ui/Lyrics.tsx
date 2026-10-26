// The identified bhajan, laid out like the bhajan slides centres already
// project: the title and its pitch centred over a rule, the lyrics
// left-aligned below, the English meaning in italics over a closing rule.
//
// Read from the back of a hall, so the lyrics are as large as the space between
// the rules allows: a two-line bhajan sets huge, a twelve-line one smaller.
// Every sung line stays on one row, so singers can see where a line ends;
// wrapping is a last resort for long lines that would otherwise get too small.
// Lines arrive one after another, each rising slightly and sharpening out of a
// blur, once, and then nothing moves while people sing.

import { useLayoutEffect, useRef, useState } from "react";

import type { Bhajan } from "../match/catalog.ts";
import { foldLatin } from "../match/search.ts";

type Line =
  | { kind: "text"; text: string; cue: string | null; times: number | null }
  | { kind: "break" };

/** Longer than any sung line in the catalog: these are prose translations. */
const PROSE_LENGTH = 150;
const DEVANAGARI = /[ऀ-ॿ]/;

/**
 * The catalog's romanised lyrics as display lines.
 *
 * "[Gana Lola]" is a cue to the singers (repeat from there) and "(5)" a repeat
 * count; both stay, set quietly beside the line. "--" separates verses.
 *
 * A few entries (long stotrams) carry more than lyrics in this field: verse
 * labels, Devanagari and English translation paragraphs. The screen shows the
 * romanised lyrics only, so those are dropped.
 */
export function parseLyrics(lyrics: string): Line[] {
  const lines: Line[] = [];
  const addBreak = () => {
    if (lines.length && lines[lines.length - 1].kind !== "break") lines.push({ kind: "break" });
  };
  for (const raw of lyrics.split("\n")) {
    const line = raw.trim();
    if (!line || /^-{2,}$/.test(line) || /^verse\s+\d+$/i.test(line)) {
      addBreak();
      continue;
    }
    if (DEVANAGARI.test(line) || line.length > PROSE_LENGTH) continue;
    const cue = line.match(/\[([^\]]*)\]/)?.[1]?.replace(/\.{2,}|…/g, "").trim() || null;
    const times = Number(line.match(/\((\d+)\)/)?.[1]) || null;
    const text = line
      .replace(/\[[^\]]*\]/g, "")
      .replace(/\(\d+\)/g, "")
      .replace(/\|+\s*\d*\s*\|*/g, "") // verse-end marks: "|", "|| 1 ||"
      .replace(/\s+/g, " ")
      .trim();
    if (text) lines.push({ kind: "text", text, cue, times });
  }
  while (lines.length && lines[lines.length - 1].kind === "break") lines.pop();
  return lines;
}

/** Below this the lyrics may wrap rather than shrink further (px). */
const WRAP_FLOOR = { wide: 40, narrow: 26 };
const MIN_SIZE = 18;
const STAGGER_MS = 90;
const FIRST_LINE_MS = 260;

/** preview: the start page's example, set inside a small screen; decorative to assistive tech. */
export function Lyrics({ bhajan, leaving, preview = false }: { bhajan: Bhajan; leaving: boolean; preview?: boolean }) {
  const stage = useRef<HTMLDivElement>(null);
  const block = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<number | null>(null);
  const [wraps, setWraps] = useState(false);
  // True only for outliers that overflow even at MIN_SIZE with wrapping.
  const [scrolls, setScrolls] = useState(false);
  const lines = parseLyrics(bhajan.lyrics);
  const pitch = pitchLabel(bhajan);

  useLayoutEffect(() => {
    const fit = () => {
      const s = stage.current;
      const b = block.current;
      if (!s || !b) return;
      const fits = () => b.scrollHeight <= s.clientHeight && b.scrollWidth <= s.clientWidth;
      // Largest size in [lo, hi] at which the block fits, by bisection.
      const largest = (lo: number, hi: number) => {
        for (let i = 0; i < 12; i++) {
          const mid = (lo + hi) / 2;
          b.style.fontSize = `${mid}px`;
          if (fits()) lo = mid;
          else hi = mid;
        }
        return lo;
      };
      const max = Math.max(MIN_SIZE, Math.min(s.clientHeight * 0.2, s.clientWidth * 0.075, 110));
      const floor = s.clientWidth < 640 ? WRAP_FLOOR.narrow : WRAP_FLOOR.wide;

      // First, every line on one row.
      b.classList.remove("is-wrapping");
      let best = largest(MIN_SIZE, max);
      let wrapping = false;
      // Too small that way: let long lines wrap, with a clear gap between sung lines.
      // (Not in the start page's example: there one line per row is the point.)
      if (best < floor && !preview) {
        b.classList.add("is-wrapping");
        best = largest(MIN_SIZE, max);
        wrapping = true;
      }
      b.style.fontSize = `${best}px`;
      setSize(best);
      setWraps(wrapping);
      setScrolls(b.scrollHeight > s.clientHeight + 1);
    };
    fit();
    const observer = new ResizeObserver(fit);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [bhajan.slug, preview]);

  let order = 0;
  return (
    <article className={`slide${leaving ? " is-leaving" : ""}${preview ? " is-preview" : ""}`} aria-hidden={preview || undefined}>
      <h1 className="slide-title">
        {bhajan.title}
        {pitch && <span className="slide-pitch"> ({pitch})</span>}
      </h1>
      <div className={`lyrics-stage${scrolls ? " is-scrolling" : ""}`} ref={stage}>
        <div
          className={`lyrics${wraps ? " is-wrapping" : ""}`}
          ref={block}
          style={{ visibility: size === null ? "hidden" : undefined }}
          aria-live={preview ? undefined : "polite"}
        >
          {lines.map((line, i) =>
            line.kind === "break" ? (
              <div key={i} className="lyrics-break" aria-hidden="true" />
            ) : (
              <p
                key={i}
                className="lyrics-line"
                style={{ animationDelay: `${FIRST_LINE_MS + order++ * STAGGER_MS}ms` }}
              >
                {line.text}
                {line.times && <span className="lyrics-note"> ×{line.times}</span>}
                {line.cue && <span className="lyrics-note"> · repeat {line.cue}</span>}
              </p>
            ),
          )}
        </div>
      </div>
      <footer className="slide-meaning">
        {bhajan.meaning && (
          <p style={{ animationDelay: `${FIRST_LINE_MS + order * STAGGER_MS + 120}ms` }}>{bhajan.meaning}</p>
        )}
      </footer>
    </article>
  );
}

/**
 * The keys to sing in, as centre slides write them: ladies first, then gents,
 * e.g. "6 P / 2 P".
 */
export function pitchLabel(bhajan: Pick<Bhajan, "gentsPitch" | "ladiesPitch">): string {
  const ladies = bhajan.ladiesPitch?.trim();
  const gents = bhajan.gentsPitch?.trim();
  if (ladies && gents) return `${ladies} / ${gents}`;
  return ladies || gents || "";
}

/**
 * The first line of the lyrics that is not just the title. Titles are usually
 * the first line, so this is what tells apart two bhajans catalogued under the
 * same title ("Manasa Bhajare Guru Charanam" → "Sai Charanam Pranamamyaham"
 * or "Dustara Bhava Sagara Taranam").
 */
export function distinguishingLine(bhajan: Pick<Bhajan, "title" | "lyrics">): string | undefined {
  const title = foldLatin(bhajan.title);
  return parseLyrics(bhajan.lyrics).flatMap((l) => (l.kind === "text" ? [l.text] : []))
    .find((line) => !title.startsWith(foldLatin(line)));
}
