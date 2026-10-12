// The kisses — pure, unit-tested (piles.test.ts). No drawing here.
//
// Each kiss is a shower: a random handful of stickers streams out of the
// mouth, split as evenly as it can be across the four corners. Each flies on
// its own bowed path, growing as if it flies at you, spinning. In each corner
// the kisses keep to a fan: a big one right in the corner, then slots on two
// quarter-arcs out from it, smaller further out, tilted along the arc. One
// kiss per corner per shower sticks in the fan (a full fan lets its oldest
// float away); the rest burst into sparkles as they arrive.
import { ART, FAN, FLIGHT, SHOWER } from "./config";

export type Pt = { x: number; y: number };

export type Sticker = {
  id: number;
  /** Which art sprite (an index into ART.urls). */
  art: number;
  /** Size on landing (px), and its final tilt (radians). */
  size: number;
  rot: number;
  corner: number;
  /** Sticks in the corner's fan (in this slot), or bursts on arrival. */
  stick: boolean;
  slot: number;
  from: Pt;
  ctrl: Pt;
  to: Pt;
  /** Turns of spin on the way (signed), and seconds in the air. */
  spin: number;
  time: number;
  /** Seconds since launch (negative: still waiting its turn in the shower). */
  age: number;
  /** Seconds floating away from a full fan (−1: staying). */
  leave: number;
};

export type Piles = {
  stickers: Sticker[];
  /** The next id; kisses blown and stickers sent so far. */
  nextId: number;
  kisses: number;
  sent: number;
};

export const createPiles = (): Piles => ({
  stickers: [],
  nextId: 1,
  kisses: 0,
  sent: 0,
});

/** Mirror signs for a corner (0 TL, 1 TR, 2 BR, 3 BL): x and y away from it. */
const signs = (corner: number) => ({
  sx: corner === 1 || corner === 2 ? -1 : 1,
  sy: corner >= 2 ? -1 : 1,
});

/** The fan's anchor: the corner of the screen itself. */
export const fanAnchor = (corner: number, w: number, h: number): Pt => ({
  x: corner === 1 || corner === 2 ? w : 0,
  y: corner >= 2 ? h : 0,
});

/** Where slot `i` of a corner's fan is, its size, and its tilt. */
export const slotPose = (corner: number, i: number, w: number, h: number) => {
  const s = FAN.slots[i];
  const { sx, sy } = signs(corner);
  const a = (s.angle * Math.PI) / 180;
  const c = fanAnchor(corner, w, h);
  return {
    pos: { x: c.x + sx * Math.cos(a) * s.r, y: c.y + sy * Math.sin(a) * s.r },
    size: s.size,
    // Tilted along the arc, mirrored per corner.
    rot: sx * sy * (a - Math.PI / 4) * FAN.tilt,
  };
};

/**
 * Corners for `n` stickers, as even as can be: each corner gets ⌊n/4⌋, and
 * the rest go to corners picked at random (no corner twice). Shuffled.
 */
export const splitCorners = (n: number, random: () => number): number[] => {
  const out: number[] = [];
  for (let c = 0; c < 4; c++)
    for (let k = 0; k < Math.floor(n / 4); k++) out.push(c);
  const extra = [0, 1, 2, 3];
  for (let i = extra.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [extra[i], extra[j]] = [extra[j], extra[i]];
  }
  out.push(...extra.slice(0, n % 4));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

const between = ([a, b]: readonly [number, number], random: () => number) =>
  a + (b - a) * random();

/** The kisses staying in a corner's fan, oldest first. */
export const fan = (p: Piles, corner: number) =>
  p.stickers.filter((s) => s.corner === corner && s.stick && s.leave < 0);

/** Claim a slot in a corner's fan: a free one, or the oldest kiss's (it floats away). */
const claimSlot = (p: Piles, corner: number): number => {
  const staying = fan(p, corner);
  const used = new Set(staying.map((s) => s.slot));
  for (let i = 0; i < FAN.slots.length; i++) if (!used.has(i)) return i;
  staying[0].leave = 0;
  return staying[0].slot;
};

/** One sticker from `from` toward `corner`, leaving after `delay` seconds. */
const launchOne = (
  p: Piles,
  from: Pt,
  corner: number,
  stick: boolean,
  delay: number,
  w: number,
  h: number,
  random: () => number,
): Sticker => {
  let to: Pt;
  let size: number;
  let rot: number;
  let slot = -1;
  if (stick) {
    slot = claimSlot(p, corner);
    const sp = slotPose(corner, slot, w, h);
    const j = FAN.jitter;
    to = {
      x: sp.pos.x + (random() - 0.5) * 2 * j,
      y: sp.pos.y + (random() - 0.5) * 2 * j,
    };
    size = sp.size * (0.92 + 0.16 * random());
    rot = sp.rot + (random() - 0.5) * 0.2;
  } else {
    // Bursting: aimed somewhere over the fan.
    const sp = slotPose(corner, Math.floor(random() * FAN.slots.length), w, h);
    to = {
      x: sp.pos.x + (random() - 0.5) * 80,
      y: sp.pos.y + (random() - 0.5) * 80,
    };
    size = between(FAN.burstSize, random);
    rot = (random() - 0.5) * 0.8;
  }
  // Bow the path out to one side by a random amount (the shower fans out),
  // lifted a little (kisses float up first).
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const bow = (random() < 0.5 ? -1 : 1) * FLIGHT.bow * (0.25 + 0.75 * random());
  const ctrl = {
    x: (from.x + to.x) / 2 + (-dy / Math.max(1, dist)) * dist * bow,
    y:
      (from.y + to.y) / 2 + (dx / Math.max(1, dist)) * dist * bow - dist * 0.12,
  };
  const s: Sticker = {
    id: p.nextId++,
    art: Math.floor(random() * ART.urls.length) % ART.urls.length,
    size,
    rot,
    corner,
    stick,
    slot,
    from: { ...from },
    ctrl,
    to,
    spin: (random() < 0.5 ? -1 : 1) * FLIGHT.spin * (0.5 + random()),
    time: between(FLIGHT.time, random),
    age: -delay,
    leave: -1,
  };
  p.stickers.push(s);
  p.sent++;
  return s;
};

/**
 * A kiss from `from` (the mouth) on a `w` × `h` screen: a shower of
 * SHOWER.count stickers, streaming out over SHOWER.stream seconds, split
 * evenly across the corners; the first to each corner sticks in its fan.
 */
export const blowKiss = (
  p: Piles,
  from: Pt,
  w: number,
  h: number,
  random: () => number,
): Sticker[] => {
  const n =
    SHOWER.count[0] +
    Math.floor(random() * (SHOWER.count[1] - SHOWER.count[0] + 1));
  p.kisses++;
  const stuck = new Set<number>();
  return splitCorners(n, random).map((corner, i) => {
    const stick = !stuck.has(corner);
    stuck.add(corner);
    return launchOne(
      p,
      from,
      corner,
      stick,
      (i / Math.max(1, n - 1)) * SHOWER.stream * (0.8 + 0.4 * random()),
      w,
      h,
      random,
    );
  });
};

/** It has arrived (stuck in its fan, or bursting). */
export const landed = (s: Sticker) => s.age >= s.time;

export type PileEvents = {
  /** Kisses that stuck in a fan, and kisses that burst, this frame. */
  stuck: Sticker[];
  burst: Sticker[];
};

/** Advance one frame. */
export const stepPiles = (p: Piles, dt: number): PileEvents => {
  const ev: PileEvents = { stuck: [], burst: [] };
  for (const s of p.stickers) {
    const before = landed(s);
    s.age += dt;
    if (!before && landed(s)) (s.stick ? ev.stuck : ev.burst).push(s);
    if (s.leave >= 0) s.leave += dt;
  }
  p.stickers = p.stickers.filter(
    (s) =>
      (s.stick || s.age < s.time + FAN.burst) &&
      (s.leave < 0 || s.leave < FAN.leave),
  );
  return ev;
};

const easeInOut = (u: number) =>
  u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;

export type Pose = {
  x: number;
  y: number;
  /** Size (px) along its own x and y (a landing squashes one, stretches the other). */
  sx: number;
  sy: number;
  rot: number;
  alpha: number;
};

/** Where and how a sticker shows now (`t`: the clock, for the fans' breathing). */
export const pose = (s: Sticker, t = 0): Pose => {
  if (s.age < 0)
    // Still waiting its turn in the shower: hidden in the mouth.
    return { x: s.from.x, y: s.from.y, sx: 0, sy: 0, rot: 0, alpha: 0 };
  if (!landed(s)) {
    const u = s.age / s.time;
    const e = easeInOut(u);
    const v = 1 - e;
    const x = v * v * s.from.x + 2 * v * e * s.ctrl.x + e * e * s.to.x;
    const y = v * v * s.from.y + 2 * v * e * s.ctrl.y + e * e * s.to.y;
    // Grows from small at the mouth, swells mid-flight (flying at you), and
    // comes down to its size as it lands.
    const base = FLIGHT.start + (1 - FLIGHT.start) * e;
    const size =
      s.size * (base + (FLIGHT.peak - 1) * Math.sin(Math.PI * u) * 1.2);
    return {
      x,
      y,
      sx: size,
      sy: size,
      rot: s.rot + s.spin * Math.PI * 2 * (1 - e),
      alpha: 1,
    };
  }
  const since = s.age - s.time;
  if (!s.stick) {
    // Bursting: swells and fades as it pops into sparkles.
    const u = Math.min(1, since / FAN.burst);
    const k = 1 + 0.7 * u;
    return {
      x: s.to.x,
      y: s.to.y,
      sx: s.size * k,
      sy: s.size * k,
      rot: s.rot,
      alpha: 1 - u,
    };
  }
  // In the fan: a landing squash that wobbles out, then a gentle breathing
  // sway; floating up and away when a newer kiss takes its slot.
  const squash =
    since < FLIGHT.settle
      ? FLIGHT.squash * Math.exp(-since * 9) * Math.cos(since * 28)
      : 0;
  const breathe = 1 + FAN.breathe * Math.sin(t * 2.1 + s.id * 1.7);
  const sway = FAN.sway * Math.sin(t * 1.3 + s.id * 2.3);
  const away = s.leave < 0 ? 0 : Math.min(1, s.leave / FAN.leave);
  const k = breathe * (1 - 0.35 * away);
  return {
    x: s.to.x,
    y: s.to.y - 70 * away * away,
    sx: s.size * k * (1 + squash),
    sy: s.size * k * (1 - squash),
    rot: s.rot + sway,
    alpha: 1 - away,
  };
};
