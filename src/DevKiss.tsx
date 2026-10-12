// DevKiss.tsx — dev-only key for the built-in preview, where no sample video
// blows a kiss:
//   K   blow a kiss (from the mouth when a face is in view)
// Never reaches production: Scene.tsx lazy-imports this behind an inline
// `process.env.NODE_ENV` check, which esbuild folds.
import { useEffect } from "react";

import { requestKiss } from "./kiss/state";

const DevKiss = () => {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "k" || e.key === "K") requestKiss();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  return null;
};

export default DevKiss;
