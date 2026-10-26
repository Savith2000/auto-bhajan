// Noticing that something loud has started.
//
// Only a wake-up: it may be the singer or the harmonium introduction. The
// session then asks the speech model whether there are words (words.ts), and
// only words start the countdown to an answer.
//
// Plain loudness against the room's own background (fans, chatter, a harmonium
// drone): singing is anything clearly louder than that for a few frames in a
// row. Pure and frame-driven so the eval can run it over a recording exactly
// as the browser runs it over the mic.
//
// The background is re-measured continuously, as a low percentile of the last
// few seconds, rather than fixed from the moment the button is pressed. A fixed
// measurement broke whenever the button was pressed while singing had already
// begun (or began within half a second): the singing itself became the
// "background", nothing was ever three times louder than it, and the app sat on
// "Listening…" until it gave up. A rolling low percentile follows the quiet
// moments instead, the breaths and gaps between lines, so a loud start corrects
// itself at the next pause.
//
// Except when there is no pause quiet enough. If singing starts as the mic
// opens (the first moments after the press are digital silence, which doesn't
// count), every frame the detector has heard is singing, the singing is the
// background, and legato singing may never dip to a third of itself. So
// anything loud enough counts as singing whatever the background (`loud`).

export const ONSET = {
  /** Audio heard before any decision, so there is a background to compare to (16 kHz samples). */
  calibrationSamples: 8_000, // 0.5 s
  /** How far back the background is measured from, in frames (64 ms each): ~3 s. */
  floorWindowFrames: 47,
  /**
   * The background is this percentile of that window: low enough to land in a
   * breath between sung lines, which may be only a few frames of the window.
   */
  floorPercentile: 0.05,
  /**
   * Frames quieter than this are digital silence (stream start-up, dropouts),
   * never a real room, so they are left out of the background. Otherwise a few
   * of them would drag it to zero and a harmonium drone would count as singing.
   */
  silentRms: 0.0005,
  // These lean sensitive on purpose. A trigger only wakes the word check, it
  // never starts the countdown or shows anything, so a false one costs a few
  // model runs; a missed one (soft or distant singing) costs the bhajan.
  /** Singing must be this many times louder than the background. */
  ratio: 2,
  /** ...and at least this loud, so a silent room does not trip on a breath. */
  minRms: 0.004,
  /**
   * This loud is singing whatever the background: above a quiet room or a fan,
   * and below where a voice a few metres from the mic lands.
   */
  loud: 0.03,
  /** Consecutive loud frames required (frames are 64 ms): ~0.2 s. */
  frames: 3,
  /** Audio kept from before the onset, so a soft first consonant is not cut. */
  prerollSamples: 4_800, // 0.3 s
};

export class OnsetDetector {
  private readonly config: typeof ONSET;
  private seen = 0;
  /** Recent frame levels, oldest first, at most floorWindowFrames long. */
  private readonly recent: number[] = [];
  private run = 0;
  private runStart = 0;
  /** Sample index (since start) where singing begins, preroll included. */
  onset: number | null = null;

  constructor(config: typeof ONSET = ONSET) {
    this.config = config;
  }

  /** The background level right now: a low percentile of the recent window. */
  floor(): number {
    const sorted = this.recent.filter((r) => r >= this.config.silentRms).sort((a, b) => a - b);
    if (!sorted.length) return 0;
    return sorted[Math.floor((sorted.length - 1) * this.config.floorPercentile)];
  }

  /** Feed one frame's RMS and length. Returns the onset once it is found. */
  push(rms: number, length: number): number | null {
    const start = this.seen;
    this.seen += length;
    if (this.onset !== null) return this.onset;

    // Judged against the background as it stood before this frame.
    const threshold = Math.min(this.config.loud, Math.max(this.config.minRms, this.floor() * this.config.ratio));
    this.recent.push(rms);
    if (this.recent.length > this.config.floorWindowFrames) this.recent.shift();
    if (start < this.config.calibrationSamples) return null;

    if (rms >= threshold) {
      if (this.run === 0) this.runStart = start;
      this.run++;
      if (this.run >= this.config.frames) {
        this.onset = Math.max(0, this.runStart - this.config.prerollSamples);
      }
    } else {
      this.run = 0;
    }
    return this.onset;
  }
}
