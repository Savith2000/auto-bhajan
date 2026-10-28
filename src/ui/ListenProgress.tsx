// How far the listener is through deciding, drawn around the listen button.
//
// Nothing shows while it waits for singing: there is no deadline yet. From the
// first sung word an arc fills toward the moment the app must answer (10 s),
// with a bead for each check on the way that lights when that check has run.
// When the bhajan is found the arc closes at once, usually well before the
// deadline, and fades as the button docks. Two bhajans that open the same way
// send it round a second lap, toward the 20 s limit, over the first one.
//
// Every part follows the session's real clock and checks; none of it is a
// guess about how long is left.

import { useEffect, useRef } from "react";

import { RULES } from "../match/identify.ts";

type Props = {
  /** Wall-clock ms (performance.now) at which the first sung words began; null while waiting for them. */
  since: number | null;
  twin: boolean;
  /** Checkpoints (seconds after the first words) whose checks have run. */
  checked: number[];
  /** The bhajan was just found. */
  found: boolean;
};

/** Short of a full lap, so the arc never closes on its own: only an answer closes it. */
const HOLD = 0.97;
const R = 48;

const laps = [
  { from: 0, to: RULES.decideAfter, beads: RULES.checkpoints },
  { from: RULES.decideAfter, to: RULES.twinDecideAfter, beads: RULES.twinCheckpoints },
];

export function ListenProgress({ since, twin, checked, found }: Props) {
  const arcs = [useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null)];
  // While the arc runs, and then while it closes on an answer.
  const mode = useRef<"off" | "running" | "done">("off");
  const wasTwin = useRef(false);
  if (since !== null) {
    mode.current = "running";
    wasTwin.current = twin;
  } else {
    mode.current = found && mode.current !== "off" ? "done" : "off";
  }
  const state = mode.current;
  const lap = wasTwin.current && state !== "off" ? 1 : 0;

  useEffect(() => {
    const set = (i: number, fraction: number) => {
      const arc = arcs[i].current;
      if (arc) arc.style.strokeDashoffset = String(1 - fraction);
    };
    if (state === "off") {
      set(0, 0);
      set(1, 0);
      return;
    }
    if (state === "done") {
      set(lap, 1);
      return;
    }
    let frame = 0;
    const tick = () => {
      const t = (performance.now() - since!) / 1000;
      laps.forEach(({ from, to }, i) => {
        set(i, i < lap ? 1 : i > lap ? 0 : Math.min(Math.max((t - from) / (to - from), 0), HOLD));
      });
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [state, lap, since]);

  return (
    <svg className={`listen-progress is-${state}${lap ? " is-twin" : ""}`} viewBox="0 0 100 100" aria-hidden="true">
      <circle className="listen-progress-track" cx="50" cy="50" r={R} pathLength={1} />
      {laps.map((_, i) => (
        <circle
          key={i}
          ref={arcs[i]}
          className={`listen-progress-arc lap-${i}`}
          cx="50"
          cy="50"
          r={R}
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset="1"
        />
      ))}
      {laps.map(({ from, to, beads }, i) => (
        <g key={i} className={`listen-progress-beads${i === lap ? " is-current" : ""}`}>
          {beads.map((at) => {
            const angle = ((at - from) / (to - from)) * 2 * Math.PI;
            const lit = state === "done" || checked.includes(at);
            return (
              <circle
                key={at}
                className={`listen-progress-bead${lit ? " is-lit" : ""}`}
                cx={50 + R * Math.cos(angle)}
                cy={50 + R * Math.sin(angle)}
                r="1.7"
              />
            );
          })}
        </g>
      ))}
    </svg>
  );
}
