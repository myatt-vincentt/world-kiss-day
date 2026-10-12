// Every tunable in one place. Units: design px (the 1280-tall design screen,
// x right, y down), seconds, unless noted.

/** Blowing a kiss (the SDK's mouthPout value): on above, off below, held this long, then a rest. */
export const KISS = { on: 0.6, off: 0.35, hold: 0.15, cooldown: 0.6 };

/**
 * Each corner's fan (top-left, top-right, bottom-right, bottom-left), anchored
 * at the corner itself: a big kiss right in the corner, then slots on two
 * quarter-arcs out from it (radius px, angle in degrees from the top / bottom
 * edge, size px), tilted along the arc. The outer ring stays off the bottom
 * edge's middle (the title). Kisses there breathe and sway; one pushed out
 * floats away; the rest of a shower bursts on arrival.
 */
export const FAN = {
  slots: [
    { r: 26, angle: 45, size: 126 },
    { r: 138, angle: 22, size: 100 },
    { r: 138, angle: 68, size: 100 },
    { r: 248, angle: 34, size: 82 },
    { r: 248, angle: 60, size: 82 },
    { r: 248, angle: 84, size: 78 },
  ],
  tilt: 0.6,
  jitter: 6,
  breathe: 0.035,
  sway: 0.06,
  /** Seconds to float away, and to burst. */
  leave: 0.8,
  burst: 0.35,
  /** Size of the kisses that burst (px). */
  burstSize: [54, 84] as const,
};

/** Sparkles: tiny hearts from each burst, and twinkles round the fans. */
export const SPARKLE = {
  perBurst: 6,
  speed: [80, 220] as const,
  life: [0.45, 0.8] as const,
  size: [10, 18] as const,
  /** Twinkles per corner, and their size (px). */
  twinkles: 7,
  twinkleSize: 16,
};

/** The soft glow behind each fan (radius px, colour). */
export const GLOW = { radius: 300, color: "rgba(255, 120, 170, 0.38)" };

/** Each kiss is a shower: this many stickers (random), streaming out over this long (s). */
export const SHOWER = { count: [10, 16] as const, stream: 0.5 };

/** The flight from your mouth to its corner. */
export const FLIGHT = {
  /** Seconds in the air (random in this range). */
  time: [0.7, 1.05] as const,
  /** Size at the mouth, and the biggest it gets on the way (flying at you). */
  start: 0.2,
  peak: 1.3,
  /** Spins (turns) on the way, either direction. */
  spin: 1,
  /** How far the path bows out (share of the distance). */
  bow: 0.28,
  /** The landing squash, and how long it takes to settle. */
  squash: 0.28,
  settle: 0.3,
};

/** Little hearts puffing out of the mouth with each kiss. */
export const BURST = {
  count: 9,
  speed: [140, 320] as const,
  life: [0.6, 1.1] as const,
  size: [16, 30] as const,
  /** They float up (px/s²) and slow down. */
  rise: 220,
};

/** The frame: a soft pink vignette, and the title along the bottom. */
export const DECOR = {
  vignette: "rgba(255, 105, 160, 0.30)",
  title: "Happy World Kiss Day",
  /** Title baseline, this far up from the bottom (px), its size, and its widest (share of the screen). */
  titleY: 64,
  titleSize: 46,
  titleWidth: 0.5,
};

/**
 * The kiss art: the project's sheet (art/lips-hearts-pattern-valentines-day.png)
 * cut into trimmed 160 px sprites in public/kisses/ — 8 lips, then 6 hearts
 * (the hearts also puff from the mouth). Its red, for the landing splat.
 */
const LIPS = 8;
const HEARTS = 6;
export const ART = {
  urls: [
    ...Array.from({ length: LIPS }, (_, i) => `/kisses/lips-${i + 1}.png`),
    ...Array.from({ length: HEARTS }, (_, i) => `/kisses/heart-${i + 1}.png`),
  ],
  /** Indices of the hearts in `urls`. */
  hearts: Array.from({ length: HEARTS }, (_, i) => LIPS + i),
  color: "#ff3a52",
};

/** The garland frame (from the Vincentt asset library, lib_c34ouw6eobq5nahb). */
export const FRAME_URL = "/frames/heart-garland.png";

/** The kiss canvas is drawn at this height (px); the width follows the screen. */
export const CANVAS = { height: 1100 };
