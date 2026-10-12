// The kiss art and the frame.
//   art    the project's kiss art sheet (art/lips-hearts-pattern-valentines-day.png),
//          cut into trimmed 160 px sprites in public/kisses/: lips and hearts
//   frame  a soft pink vignette, a glow behind each corner's fan, the heart
//          garland, the title
//   twinkle  the little stars round the fans
import { ART, DECOR, GLOW } from "./config";
import { fanAnchor } from "./piles";

type Ctx = CanvasRenderingContext2D;

/** The soft shadow baked under each sprite, so overlapping pieces stay readable. */
const SHADOW = { color: "rgba(110, 0, 30, 0.35)", blur: 10, y: 4, pad: 14 };

/**
 * Load the art sprites, each baked once (when loaded) into a canvas with a
 * soft shadow under it; returns a lookup by index (null until that one is
 * ready).
 */
export const loadArt = () => {
  const baked: (HTMLCanvasElement | null)[] = ART.urls.map(() => null);
  ART.urls.forEach((url, i) => {
    const img = new Image();
    img.onload = () => {
      const { pad } = SHADOW;
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth + pad * 2;
      canvas.height = img.naturalHeight + pad * 2;
      const ctx = canvas.getContext("2d") as Ctx;
      ctx.shadowColor = SHADOW.color;
      ctx.shadowBlur = SHADOW.blur;
      ctx.shadowOffsetY = SHADOW.y;
      ctx.drawImage(img, pad, pad);
      baked[i] = canvas;
    };
    img.src = url;
  });
  return (index: number): HTMLCanvasElement | null =>
    baked[index % baked.length];
};

/**
 * The frame, drawn once per screen size into its own canvas: a soft pink
 * vignette, the heart garland across the top (width-fitted, top-aligned), and
 * the title along the bottom. `s` is canvas px per design px.
 */
export const paintDecor = (
  ctx: Ctx,
  w: number,
  h: number,
  s: number,
  garland: HTMLImageElement | null,
) => {
  const W = w * s;
  const H = h * s;
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createRadialGradient(
    W / 2,
    H * 0.45,
    Math.min(W, H) * 0.35,
    W / 2,
    H * 0.45,
    Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, "rgba(255, 105, 160, 0)");
  g.addColorStop(1, DECOR.vignette);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // A soft glow behind each corner's fan.
  for (let c = 0; c < 4; c++) {
    const a = fanAnchor(c, w, h);
    const glow = ctx.createRadialGradient(
      a.x * s,
      a.y * s,
      0,
      a.x * s,
      a.y * s,
      GLOW.radius * s,
    );
    glow.addColorStop(0, GLOW.color);
    glow.addColorStop(1, "rgba(255, 120, 170, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }
  if (garland && garland.naturalWidth > 0) {
    const gh = (W * garland.naturalHeight) / garland.naturalWidth;
    ctx.drawImage(garland, 0, 0, W, gh);
  }
  // The title: a script face where there is one, white with a pink edge.
  let size = DECOR.titleSize * s;
  const font = (px: number) =>
    `italic 700 ${px}px "Snell Roundhand", "Segoe Script", "Brush Script MT", "Dancing Script", cursive`;
  ctx.font = font(size);
  // Narrow enough to sit between the two bottom fans.
  const maxW = W * DECOR.titleWidth;
  const tw = ctx.measureText(DECOR.title).width;
  if (tw > maxW) {
    size *= maxW / tw;
    ctx.font = font(size);
  }
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const y = H - DECOR.titleY * s;
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(200, 20, 90, 0.55)";
  ctx.shadowBlur = 12 * s;
  ctx.lineWidth = 7 * s;
  ctx.strokeStyle = "#e8417a";
  ctx.strokeText(DECOR.title, W / 2, y);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#ffffff";
  ctx.fillText(DECOR.title, W / 2, y);
};

/** A twinkle: a four-point white star with a soft glow, `r` across (canvas px). */
export const twinkle = (
  ctx: Ctx,
  x: number,
  y: number,
  r: number,
  alpha: number,
) => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(255, 190, 220, 0.9)";
  ctx.shadowBlur = r * 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -r / 2);
  ctx.quadraticCurveTo(0, 0, r / 2, 0);
  ctx.quadraticCurveTo(0, 0, 0, r / 2);
  ctx.quadraticCurveTo(0, 0, -r / 2, 0);
  ctx.quadraticCurveTo(0, 0, 0, -r / 2);
  ctx.fill();
  ctx.restore();
};
