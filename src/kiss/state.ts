// Shared live state: the scene writes it, the HUD and the dev key read and
// poke it. Plain mutable fields (no React state).
export const kissState = {
  /** A face is in view; kisses sent so far. */
  face: false,
  sent: 0,
  /** Dev: blow a kiss on the next frame. */
  kissRequested: false,
};

/** Blow a kiss as if puckered (dev key). */
export const requestKiss = () => {
  kissState.kissRequested = true;
};
