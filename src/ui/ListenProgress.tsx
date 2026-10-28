// How far the listener is through deciding, drawn around the listen button as
// five segments: the stretches up to the checks at 3, 5, 7 and 9 s and the
// decision at 10 s (five, like the petals of the emblem's lotus).
//
// Nothing shows while it waits for singing: there is no deadline yet. From the
// first sung word each segment fills with the clock, but it completes only
// once its check has run, and the next starts only then: progress is the
// clock or the work, whichever is behind, so it never runs ahead of what the
// app has actually done. The early stretches are the longest, so the ring
// gathers pace toward the end.
//
// When the bhajan is found the rest fill one after another and the gaps close
// into one unbroken ring; only then does the slide come up (App waits
// CLOSE_MS), and the ring fades as the button docks. Two bhajans that open the
// same way send a second round of five over the first, toward 20 s.

import { useEffect, useRef } from "react";

import { RULES } from "../match/identify.ts";

type Props = {
  /** Wall-clock ms (performance.now) at which the first sung words began; null while waiting for them. */
  since: number | null;
  twin: boolean;
  /** Checkpoints (seconds after the first words) whose checks have run. */
  checked: number[];
  /** The bhajan has been found and the ring is closing on it. */
  closing: boolean;
  /** The bhajan is on screen. */
  found: boolean;
};

/** Filling the rest and closing the gaps once a bhajan is found... */
const SWEEP_MS = 480;
/** ...and how long App holds the closed ring before the slide comes up. */
export const CLOSE_MS = SWEEP_MS + 180;

const R = 48;
/** Between segments, as a fraction of the circle (round caps eat into it). */
const GAP = 0.026;
/** A segment waiting on its check stops here. */
const WAIT = 0.92;
/** One segment after another as the ring closes. */
const STAGGER_MS = 60;

/** Each lap's segment boundaries, in seconds after the first words. */
const laps = [
  [0, ...RULES.checkpoints, RULES.decideAfter],
  [RULES.decideAfter, ...RULES.twinCheckpoints, RULES.twinDecideAfter],
];
const SEGMENTS = laps[0].length - 1;

type Mode = "off" | "running" | "closing" | "done";

export function ListenProgress({ since, twin, checked, found, closing }: Props) {
  const svg = useRef<SVGSVGElement>(null);
  // Running toward the deadline, closing on an answer, then done (fading).
  const mode = useRef<Mode>("off");
  const wasTwin = useRef(false);
  if (closing && since !== null) {
    mode.current = "closing";
  } else if (since !== null) {
    mode.current = "running";
    wasTwin.current = twin;
  } else {
    mode.current = found && mode.current !== "off" ? "done" : "off";
  }
  const state = mode.current;
  const lap = wasTwin.current && state !== "off" ? 1 : 0;

  // The frame loop reads the latest props from here rather than restarting.
  const latest = useRef({ since, checked, lap });
  latest.current = { since: since ?? latest.current.since, checked, lap };

  // What is drawn, eased toward the targets each frame.
  const shown = useRef({ fill: laps.map(() => Array<number>(SEGMENTS).fill(0)), gap: GAP });

  useEffect(() => {
    const arcs = [...(svg.current?.querySelectorAll<SVGCircleElement>(".listen-progress-fill") ?? [])];
    const closedAt = performance.now();
    // The first segment still open when the answer came: the close starts there.
    const from = Math.max(0, shown.current.fill[lap].findIndex((f) => f < 0.999));
    let frame = 0;
    let last = performance.now();

    const targets = (now: number): number[][] => {
      const { since: start, checked: done, lap: current } = latest.current;
      return laps.map((bounds, l) => {
        const ends = bounds.slice(1);
        if (state === "off" || l > current) return ends.map(() => 0);
        if (l < current || state === "done") return ends.map(() => 1);
        if (state === "closing") {
          return ends.map((_, k) =>
            now - closedAt >= Math.max(0, k - from) * STAGGER_MS ? 1 : shown.current.fill[l][k],
          );
        }
        const t = (now - (start ?? now)) / 1000;
        return ends.map((end, k) => {
          const begin = bounds[k];
          // Starts once the check before it has run, and completes only once its own has.
          if (k > 0 && !done.includes(begin)) return 0;
          const cap = done.includes(end) ? 1 : WAIT;
          return Math.min(Math.max((t - begin) / (end - begin), 0), cap);
        });
      });
    };

    const tick = (now: number) => {
      const dt = Math.min(now - last, 64) / 1000;
      last = now;
      const ease = 1 - Math.exp(-dt * (state === "closing" ? 20 : 12));
      const goal = targets(now);
      const { fill } = shown.current;
      let moving = false;
      fill.forEach((segments, l) =>
        segments.forEach((value, k) => {
          const next = value + (goal[l][k] - value) * ease;
          segments[k] = Math.abs(goal[l][k] - next) < 0.001 ? goal[l][k] : next;
          if (segments[k] !== goal[l][k]) moving = true;
        }),
      );
      // The gaps close once the current lap is whole.
      const whole = (state === "closing" || state === "done") && fill[lap].every((f) => f > 0.98);
      const gapGoal = whole ? 0 : GAP;
      shown.current.gap += (gapGoal - shown.current.gap) * ease;
      if (Math.abs(shown.current.gap - gapGoal) < 0.0005) shown.current.gap = gapGoal;
      else moving = true;

      draw(arcs, fill, shown.current.gap);
      if (moving || state === "running" || state === "closing") frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [state, lap]);

  return (
    <svg
      ref={svg}
      className={`listen-progress is-${state}${lap ? " is-twin" : ""}`}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      {Array.from({ length: SEGMENTS }, (_, k) => (
        <circle
          key={k}
          className="listen-progress-track"
          cx="50"
          cy="50"
          r={R}
          pathLength={1}
          style={segment(k, 1, GAP)}
        />
      ))}
      {laps.map((_, l) =>
        Array.from({ length: SEGMENTS }, (_, k) => (
          <circle
            key={`${l}-${k}`}
            className={`listen-progress-fill lap-${l}`}
            cx="50"
            cy="50"
            r={R}
            pathLength={1}
            visibility="hidden"
          />
        )),
      )}
    </svg>
  );
}

/** Dash styles drawing segment k of the circle, filled to `fill`. */
function segment(k: number, fill: number, gap: number) {
  const span = 1 / SEGMENTS - gap;
  return {
    strokeDasharray: `${span * fill} 1`,
    strokeDashoffset: String(-(k / SEGMENTS + gap / 2)),
  };
}

function draw(arcs: SVGCircleElement[], fill: number[][], gap: number) {
  fill.forEach((segments, l) =>
    segments.forEach((value, k) => {
      const arc = arcs[l * SEGMENTS + k];
      if (!arc) return;
      // An empty dash with round caps would still draw a dot.
      arc.setAttribute("visibility", value < 0.002 ? "hidden" : "visible");
      Object.assign(arc.style, segment(k, value, gap));
    }),
  );
}
