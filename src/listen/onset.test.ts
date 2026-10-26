import assert from "node:assert/strict";
import { test } from "node:test";

import { ONSET, OnsetDetector } from "./onset.ts";

const FRAME = 1024;

function feed(detector: OnsetDetector, levels: number[]): number | null {
  let onset: number | null = null;
  for (const rms of levels) onset = detector.push(rms, FRAME);
  return onset;
}

const calibration = Array(Math.ceil(ONSET.calibrationSamples / FRAME)).fill(0.002);

test("silence never triggers", () => {
  assert.equal(feed(new OnsetDetector(), [...calibration, ...Array(50).fill(0.002)]), null);
});

test("singing after calibration is found, with preroll", () => {
  const quiet = Array(10).fill(0.002);
  const onset = feed(new OnsetDetector(), [...calibration, ...quiet, 0.05, 0.05, 0.05]);
  const firstLoud = (calibration.length + quiet.length) * FRAME;
  assert.equal(onset, firstLoud - ONSET.prerollSamples);
});

test("a single click is not singing", () => {
  assert.equal(feed(new OnsetDetector(), [...calibration, 0.2, 0.002, 0.002, 0.2, 0.002]), null);
});

test("a noisy room raises the bar", () => {
  const noisy = Array(calibration.length).fill(0.01);
  // 0.018 is loud in a silent room but under twice this room's background.
  assert.equal(feed(new OnsetDetector(), [...noisy, 0.018, 0.018, 0.018, 0.018]), null);
  assert.notEqual(feed(new OnsetDetector(), [...noisy, 0.025, 0.025, 0.025]), null);
});

// The bug this replaced: pressed while singing had already begun, the singing
// became the "background" and was never detected.
test("pressed while already singing loudly: found at once", () => {
  const line = Array(30).fill(0.14); // ~2 s of a sung line
  const onset = feed(new OnsetDetector(), line);
  assert.equal(onset, Math.ceil(ONSET.calibrationSamples / FRAME) * FRAME - ONSET.prerollSamples);
});

test("pressed while already singing softly: found at the next gap between lines", () => {
  const line = Array(30).fill(0.02); // ~2 s of a sung line, under `loud`
  const breath = Array(5).fill(0.003); // ~0.3 s gap
  const levels = [...line, ...breath, ...line];
  const onset = feed(new OnsetDetector(), levels);
  assert.notEqual(onset, null, "singing should be detected after the first breath");
  // ...at the start of the second line (minus preroll), not somewhere random.
  const secondLine = (line.length + breath.length) * FRAME;
  assert.equal(onset, secondLine - ONSET.prerollSamples);
});

test("singing that starts a moment after the press is found at once", () => {
  const onset = feed(new OnsetDetector(), [...Array(4).fill(0.002), ...Array(40).fill(0.14)]);
  assert.notEqual(onset, null);
  assert.ok(onset! <= 4 * FRAME, `onset ${onset}`);
});

test("a steady harmonium drone is background, not singing", () => {
  const drone = Array(60).fill(0.012);
  assert.equal(feed(new OnsetDetector(), drone), null);
  // ...but a voice over it is singing.
  assert.notEqual(feed(new OnsetDetector(), [...drone, 0.03, 0.04, 0.03, 0.04]), null);
});

test("a few dropped frames do not drag the background to zero", () => {
  const drone = Array(30).fill(0.012);
  const dropout = [0, 0, 0];
  // Without the percentile, the zeros would make the drone itself "2x louder".
  assert.equal(feed(new OnsetDetector(), [...drone, ...dropout, ...drone]), null);
});

// Reported: singing within a couple of seconds of the press was never picked
// up. The mic opens on digital silence, so if the singing is already going when
// real sound arrives, the singing was the only "background" there was.
test("singing from the moment the mic opens is found at once", () => {
  const startup = Array(5).fill(0); // the mic's first frames: digital silence
  const legato = Array.from({ length: 60 }, (_, i) => 0.07 + 0.08 * ((i * 7) % 10) / 10);
  const onset = feed(new OnsetDetector(), [...startup, ...legato]);
  assert.notEqual(onset, null);
  assert.ok(onset! <= 9 * FRAME, `onset ${onset}`);
});

test("loud enough is singing whatever the background", () => {
  const singing = Array(60).fill(0.12);
  assert.notEqual(feed(new OnsetDetector(), singing), null);
});
