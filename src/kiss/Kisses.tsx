// World Kiss Day: blow a kiss and a shower of kisses — lips and hearts from
// the project's art — streams out of your mouth to stick in the four corners
// of the screen, where they keep to tidy fans. Keep going: endless.
//
//   renderOrder −999  the camera (App.tsx's VideoBackground)
//   renderOrder 50    one 2D canvas, redrawn every frame: the frame (pink
//                     vignette, corner glows, heart garland, title), twinkles,
//                     the corner fans, bursts, splats, heart puffs, and the
//                     kisses in flight
//
// The canvas is a full-screen quad drawn straight to clip space. Coordinates
// are design px (the 1280-tall design screen, x right, y down). Face
// landmarks are in the tracker's input frame (top-left origin), which here
// matches the screen: x × width, y × height.
import { useEffect, useMemo, useState } from "react";
import { CanvasTexture, ShaderMaterial, SRGBColorSpace } from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { getFaceActionValue, useFaceInfo } from "@vincentt-xr/sdk/tracking";

import { ART, BURST, CANVAS, FRAME_URL, SPARKLE } from "./config";
import { createKiss, stepKiss } from "./kiss";
import {
  blowKiss,
  createPiles,
  fanAnchor,
  landed,
  pose,
  type Pt,
  stepPiles,
} from "./piles";
import { play } from "./sound";
import { kissState } from "./state";
import { loadArt, paintDecor, twinkle } from "./stickers";

const DESIGN_H = 1280;
/** Seconds between landing splat sounds. */
const SPLAT_GAP = 0.09;
// Face mesh landmarks: inner upper and lower lip.
const LIP_UPPER = 13;
const LIP_LOWER = 14;

const layerVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy * 2.0, 0.0, 1.0); }
`;
const layerFrag = /* glsl */ `
  uniform sampler2D uMap;
  varying vec2 vUv;
  void main() {
    gl_FragColor = texture2D(uMap, vUv);
    #include <colorspace_fragment>
  }
`;

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  return {
    canvas,
    ctx: canvas.getContext("2d") as CanvasRenderingContext2D,
  };
};

const rand = ([a, b]: readonly [number, number]) => a + Math.random() * (b - a);

type Puff = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  /** Which art heart. */
  art: number;
  rot: number;
};
type Splat = { x: number; y: number; size: number; age: number };

export const Kisses = () => {
  const { size } = useThree();
  const face = useFaceInfo({ active: true });
  const [garland, setGarland] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setGarland(img);
    img.src = FRAME_URL;
  }, []);

  const aspect = size.width / Math.max(1, size.height);
  const designW = DESIGN_H * aspect;
  const layer = useMemo(() => {
    const h = CANVAS.height;
    const w = Math.max(2, Math.round(h * aspect));
    const main = makeCanvas(w, h);
    const texture = new CanvasTexture(main.canvas);
    texture.colorSpace = SRGBColorSpace;
    const material = new ShaderMaterial({
      uniforms: { uMap: { value: texture } },
      vertexShader: layerVert,
      fragmentShader: layerFrag,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    return { main, texture, material, s: h / DESIGN_H };
    // Rebuilt only when the aspect changes noticeably (a rotation).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Math.round(aspect * 20)]);
  const decor = useMemo(() => {
    const d = makeCanvas(layer.main.canvas.width, layer.main.canvas.height);
    paintDecor(d.ctx, DESIGN_H * aspect, DESIGN_H, layer.s, garland);
    return d;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, garland]);
  useEffect(
    () => () => {
      layer.texture.dispose();
      layer.material.dispose();
    },
    [layer],
  );

  const live = useMemo(
    () => ({
      kiss: createKiss(),
      piles: createPiles(),
      art: loadArt(),
      puffs: [] as Puff[],
      splats: [] as Splat[],
      mouth: null as Pt | null,
      lastSplat: 0,
      /** Twinkle spots round each fan (radius, angle, phase). */
      twinkles: Array.from({ length: 4 * SPARKLE.twinkles }, (_, i) => ({
        corner: i % 4,
        r: 50 + Math.random() * 230,
        angle: Math.random() * (Math.PI / 2),
        phase: Math.random() * Math.PI * 2,
      })),
    }),
    [],
  );

  // Dev hook for inspecting the kisses live.
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __kiss?: unknown }).__kiss = {
        state: kissState,
        live,
        layer,
      };
    }
  }, [live, layer]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 0.1);
    const t = state.clock.elapsedTime;
    const W = designW;
    const H = DESIGN_H;
    const { piles } = live;

    // The mouth, and the kiss.
    const lm = face?.landmarks;
    live.mouth =
      lm && lm.length > LIP_LOWER
        ? {
            x: ((lm[LIP_UPPER].x + lm[LIP_LOWER].x) / 2) * W,
            y: ((lm[LIP_UPPER].y + lm[LIP_LOWER].y) / 2) * H,
          }
        : null;
    kissState.face = !!face;
    const pout = face ? getFaceActionValue(face, "mouthPout") : null;
    let kissed = stepKiss(live.kiss, pout, dt);
    if (kissState.kissRequested) {
      kissState.kissRequested = false;
      kissed = true;
    }
    if (kissed) {
      const from = live.mouth ?? { x: W / 2, y: H * 0.55 };
      blowKiss(piles, from, W, H, Math.random);
      kissState.sent = piles.kisses;
      play(Math.random() < 0.5 ? "mwah1" : "mwah2");
      // Hearts puff out of the mouth.
      for (let i = 0; i < BURST.count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const v = rand(BURST.speed);
        const life = rand(BURST.life);
        live.puffs.push({
          x: from.x,
          y: from.y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life,
          max: life,
          size: rand(BURST.size),
          art: ART.hearts[i % ART.hearts.length],
          rot: (Math.random() - 0.5) * 0.8,
        });
      }
    }
    const now = performance.now() / 1000;
    const ev = stepPiles(piles, dt);
    for (const st of ev.stuck) {
      // A shower lands in a patter, not a machine-gun: one splat at a time.
      if (now - live.lastSplat > SPLAT_GAP) {
        live.lastSplat = now;
        play("splat");
      }
      live.splats.push({ x: st.to.x, y: st.to.y, size: st.size, age: 0 });
    }
    // The rest of the shower bursts into tiny hearts over the fan.
    for (const st of ev.burst)
      for (let i = 0; i < SPARKLE.perBurst; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = rand(SPARKLE.speed);
        const life = rand(SPARKLE.life);
        live.puffs.push({
          x: st.to.x,
          y: st.to.y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life,
          max: life,
          size: rand(SPARKLE.size),
          art: ART.hearts[(st.id + i) % ART.hearts.length],
          rot: (Math.random() - 0.5) * 0.8,
        });
      }
    for (const p of live.puffs) {
      p.life -= dt;
      const drag = Math.exp(-2.2 * dt);
      p.vx *= drag;
      p.vy = p.vy * drag - BURST.rise * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    live.puffs = live.puffs.filter((p) => p.life > 0);
    for (const sp of live.splats) sp.age += dt;
    live.splats = live.splats.filter((sp) => sp.age < 0.45);

    // Paint.
    const { ctx, canvas } = layer.main;
    const { s } = layer;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.drawImage(decor.canvas, 0, 0);
    // Stamp a sprite at (x, y), fitted into sx × sy (keeping its shape).
    const stamp = (
      img: HTMLCanvasElement | HTMLImageElement | null,
      x: number,
      y: number,
      sx: number,
      sy: number,
      rot: number,
      alpha: number,
    ) => {
      if (!img || alpha <= 0) return;
      const iw = img.width;
      const ih = img.height;
      const k = 1 / Math.max(1, iw, ih);
      const dw = sx * iw * k * s;
      const dh = sy * ih * k * s;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x * s, y * s);
      ctx.rotate(rot);
      ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);
      ctx.restore();
    };
    const draw = (st: (typeof piles.stickers)[number]) => {
      const p = pose(st, t);
      stamp(live.art(st.art), p.x, p.y, p.sx, p.sy, p.rot, p.alpha);
    };
    // Twinkles round the fans.
    for (const tw of live.twinkles) {
      const a = Math.max(0, Math.sin(t * 2.4 + tw.phase)) ** 4;
      if (a < 0.02) continue;
      const c = fanAnchor(tw.corner, W, H);
      const sx = tw.corner === 1 || tw.corner === 2 ? -1 : 1;
      const sy = tw.corner >= 2 ? -1 : 1;
      twinkle(
        ctx,
        (c.x + sx * Math.cos(tw.angle) * tw.r) * s,
        (c.y + sy * Math.sin(tw.angle) * tw.r) * s,
        SPARKLE.twinkleSize * (0.6 + 0.4 * a) * s,
        a,
      );
    }
    // The fans (the small outer kisses under the big inner ones), the bursts,
    // the splats, the hearts, and the kisses still flying on top.
    const fans = piles.stickers
      .filter((st) => st.stick && landed(st))
      .sort((a, b) => b.slot - a.slot || a.id - b.id);
    for (const st of fans) draw(st);
    for (const st of piles.stickers) if (!st.stick && landed(st)) draw(st);
    for (const sp of live.splats) {
      const u = sp.age / 0.45;
      ctx.save();
      ctx.globalAlpha = (1 - u) * 0.8;
      ctx.strokeStyle = ART.color;
      ctx.lineWidth = 5 * s * (1 - u);
      ctx.beginPath();
      ctx.arc(
        sp.x * s,
        sp.y * s,
        sp.size * (0.45 + 0.5 * u) * s,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
      ctx.restore();
    }
    for (const p of live.puffs) {
      const k = p.life / p.max;
      stamp(
        live.art(p.art),
        p.x,
        p.y,
        p.size,
        p.size,
        p.rot,
        Math.min(1, k * 1.8),
      );
    }
    for (const st of piles.stickers) if (!landed(st)) draw(st);
    layer.texture.needsUpdate = true;
  });

  return (
    <mesh
      name="kisses"
      material={layer.material}
      renderOrder={50}
      frustumCulled={false}
    >
      <planeGeometry args={[1, 1]} />
    </mesh>
  );
};
