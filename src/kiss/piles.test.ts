import { describe, expect, it } from "vitest";

import { FAN, FLIGHT, KISS, SHOWER } from "./config";
import { createKiss, stepKiss } from "./kiss";
import {
  blowKiss,
  createPiles,
  fan,
  fanAnchor,
  landed,
  pose,
  slotPose,
  splitCorners,
  stepPiles,
} from "./piles";

const W = 720;
const H = 1280;
const random = (() => {
  let s = 11;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
})();
const mouth = { x: 360, y: 560 };

const run = (p: ReturnType<typeof createPiles>, seconds: number) => {
  const ev = { stuck: 0, burst: 0 };
  for (let t = 0; t < seconds; t += 1 / 60) {
    const e = stepPiles(p, 1 / 60);
    ev.stuck += e.stuck.length;
    ev.burst += e.burst.length;
  }
  return ev;
};
const ALL_IN = SHOWER.stream * 1.2 + FLIGHT.time[1] + 0.05;

describe("a kiss is a shower to the four corners", () => {
  it("splits evenly: counts differ by at most one", () => {
    for (let n = 1; n <= 20; n++) {
      const corners = splitCorners(n, random);
      expect(corners.length).toBe(n);
      const counts = [0, 1, 2, 3].map(
        (c) => corners.filter((x) => x === c).length,
      );
      expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
    }
  });

  it("a random handful streams out; one per corner sticks, the rest burst", () => {
    const p = createPiles();
    const sizes = new Set<number>();
    for (let k = 0; k < 4; k++) {
      const shower = blowKiss(p, mouth, W, H, random);
      sizes.add(shower.length);
      expect(shower.length).toBeGreaterThanOrEqual(SHOWER.count[0]);
      expect(shower.length).toBeLessThanOrEqual(SHOWER.count[1]);
      expect(Math.max(...shower.map((s) => -s.age))).toBeGreaterThan(
        SHOWER.stream * 0.5,
      );
      for (let c = 0; c < 4; c++)
        expect(shower.filter((s) => s.corner === c && s.stick).length).toBe(1);
      const ev = run(p, ALL_IN + FAN.burst + 0.1);
      expect(ev.stuck).toBe(4);
      expect(ev.burst).toBe(shower.length - 4);
      // Bursts are gone; the fans stay.
      expect(p.stickers.every((s) => s.stick)).toBe(true);
    }
    expect(sizes.size).toBeGreaterThan(1);
  });

  it("stuck kisses sit in their corner's fan slots, on screen", () => {
    const p = createPiles();
    for (let k = 0; k < 3; k++) blowKiss(p, mouth, W, H, random);
    run(p, ALL_IN + 0.5);
    for (const s of p.stickers) {
      const slot = slotPose(s.corner, s.slot, W, H);
      expect(
        Math.hypot(s.to.x - slot.pos.x, s.to.y - slot.pos.y),
      ).toBeLessThanOrEqual(FAN.jitter * 1.5);
      const a = fanAnchor(s.corner, W, H);
      expect(Math.hypot(s.to.x - a.x, s.to.y - a.y)).toBeLessThan(260);
      expect(s.to.x).toBeGreaterThanOrEqual(0);
      expect(s.to.x).toBeLessThanOrEqual(W);
    }
  });

  it("a full fan lets its oldest float away: never more than its slots", () => {
    const p = createPiles();
    for (let k = 0; k < FAN.slots.length + 3; k++) {
      blowKiss(p, mouth, W, H, random);
      run(p, ALL_IN);
    }
    run(p, FAN.leave + 0.1);
    for (let c = 0; c < 4; c++) {
      const kept = fan(p, c);
      expect(kept.length).toBe(FAN.slots.length);
      expect(new Set(kept.map((s) => s.slot)).size).toBe(FAN.slots.length);
    }
  });

  it("waits hidden, flies (swelling), lands at its size; then breathes gently", () => {
    const p = createPiles();
    const shower = blowKiss(p, mouth, W, H, random);
    // One that leaves a little after the first.
    const s = shower.find((x) => x.stick && x.age < 0)!;
    expect(pose(s).alpha).toBe(0);
    let peak = 0;
    for (let t = 0; t < ALL_IN; t += 1 / 60) {
      stepPiles(p, 1 / 60);
      if (s.age > 0 && !landed(s)) peak = Math.max(peak, pose(s).sx);
    }
    expect(peak).toBeGreaterThan(s.size * 1.1);
    run(p, FLIGHT.settle + 0.1);
    for (const t of [0, 0.7, 1.4, 2.1]) {
      const q = pose(s, t);
      expect(q.x).toBe(s.to.x);
      expect(Math.abs(q.sx / s.size - 1)).toBeLessThanOrEqual(
        FAN.breathe + 1e-6,
      );
      expect(Math.abs(q.rot - s.rot)).toBeLessThanOrEqual(FAN.sway + 1e-6);
    }
  });
});

describe("kiss detection", () => {
  const feed = (values: (number | null)[]) => {
    const k = createKiss();
    return values.map((v) => stepKiss(k, v, 1 / 30));
  };

  it("a held pucker fires once", () => {
    const frames = Math.ceil(KISS.hold * 30) + 20;
    expect(feed(Array(frames).fill(0.9)).filter(Boolean).length).toBe(1);
  });

  it("a flicker (talking) doesn't fire", () => {
    const flicker = Array.from({ length: 60 }, (_, i) =>
      i % 3 === 0 ? 0.9 : 0.2,
    );
    expect(feed(flicker).some(Boolean)).toBe(false);
  });

  it("relax, wait out the rest, kiss again: fires again", () => {
    const k = createKiss();
    const pucker = (s: number) => {
      let n = 0;
      for (let t = 0; t < s; t += 1 / 30) if (stepKiss(k, 0.9, 1 / 30)) n++;
      return n;
    };
    expect(pucker(0.5)).toBe(1);
    for (let t = 0; t < KISS.cooldown + 0.1; t += 1 / 30)
      stepKiss(k, 0.1, 1 / 30);
    expect(pucker(0.5)).toBe(1);
  });
});
