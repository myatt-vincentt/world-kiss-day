// Sound effects, through the SDK's sound engine (silent-switch safe, muted by
// default; the speaker button's tap is the gesture that unlocks iOS audio).
// The clips are synthesised for this project (public/sounds/*.m4a).
import { playOneShot, registerSound } from "@vincentt-xr/sdk";

export const SOUNDS = {
  mwah1: "/sounds/mwah1.m4a",
  mwah2: "/sounds/mwah2.m4a",
  splat: "/sounds/splat.m4a",
} as const;

export type SoundName = keyof typeof SOUNDS;

/** Buffer every clip so the first unmute is instant. */
export const loadSounds = () =>
  Promise.all(Object.values(SOUNDS).map((url) => registerSound(url)));

/** Play a clip (a no-op while muted). */
export const play = (name: SoundName) => {
  playOneShot(SOUNDS[name]);
};
