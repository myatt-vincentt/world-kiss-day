# Plan — World Kiss Day

Blow a kiss and a shower of kisses flies out of your mouth to the four corners of the screen.
Endless. Built 2026-10-12.

## Decisions (the user's)

- Kiss art: first a mix of drawn lipstick prints, lips and hearts — then, at the user's request,
  **only the user's own art** (`art/lips-hearts-pattern-valentines-day.png`, trimmed into
  sprites).
- Look: the camera with a Kiss Day frame, using a Vincentt library asset where it helps (the
  heart garland, `lib_c34ouw6eobq5nahb`), plus a pink vignette and our own title.
- Extras: sounds, a heart burst from the mouth.
- Round 2 ("visually not good"): each kiss is a **shower** of many kisses, split near-evenly
  across the four corners.
- Round 3 ("stuck on each other, overwhelming, not artistic"): corners became tidy **fans**
  with effects; then "spread nearly 0 at each corner" — the fans are anchored at the corner
  points themselves.

## How it works

- **Kiss** (`kiss.ts`, pure): the SDK's `mouthPout` value above 0.6 for 0.15 s fires once; it
  re-arms below 0.35 after a 0.6 s rest (the SDK default, 0.5, also fires while talking).
- **Showers and fans** (`piles.ts`, pure): a kiss sends 10–16 stickers from the mouth (face
  landmarks 13 / 14), streaming out over 0.5 s, split across the corners as evenly as possible
  (`splitCorners`: counts differ by at most one). Each flies a bowed quadratic path (0.7–1.05 s),
  starting small, swelling mid-flight, spinning. The first to each corner sticks into the
  corner's fan: 6 slots — one big in the corner (r 26), two at r 138, three at r 248, tilted
  along the arc, the outer ring kept off the bottom edge's middle (the title). A full fan's
  oldest floats up and fades. The rest burst (swell and fade) into tiny hearts. Stuck kisses
  breathe (±3.5 %) and sway (±0.06 rad).
- **Drawing** (`Kisses.tsx`, `stickers.ts`): one 2D canvas redrawn every frame, a full-screen
  clip-space quad at renderOrder 50 over the camera. The frame (vignette, corner glows, garland,
  title) is painted once per screen size; then twinkles, the fans (outer under inner), bursts,
  landing rings, heart puffs, kisses in flight. The art sprites are baked once with a soft
  shadow so overlapping pieces stay readable.
- **Sound** (`sound.ts`): synthesised "mwah" ×2 (formant voice and a lip pop) and a splat
  (spaced out so a shower patters).

## Notes

- The dev server only serves `public/` folders that existed when it started: after adding
  `public/kisses/` it had to be restarted (404s otherwise).
- The flat single-red art merges into blobs when piled; the fans and the baked shadow fix it.
