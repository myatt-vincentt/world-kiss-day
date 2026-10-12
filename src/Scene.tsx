// Scene.tsx — World Kiss Day: blow a kiss and a shower of kisses flies out of
// your mouth to the four corners of the screen, where they keep to fans.
// See PLAN.md.
import { lazy, Suspense } from "react";

import { ExperienceStatus } from "./kiss/ExperienceStatus";
import { Hud } from "./kiss/Hud";
import { Kisses } from "./kiss/Kisses";

// Dev-only tools (media switcher; kiss key) for previewing without a camera.
// Lazy and behind a constant esbuild folds to false in production. Two rules:
// `process.env.NODE_ENV`, not `import.meta.env.DEV`
// (vincentt-xr/v2-template#112); and write the check INSIDE each ternary —
// hoisted into a `const`, esbuild keeps the dead branch.
const DevMediaSwitcher =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevMediaSwitcher"))
    : null;
const DevKiss =
  process.env.NODE_ENV !== "production"
    ? lazy(() => import("./DevKiss"))
    : null;

export const Scene = () => (
  <>
    <ExperienceStatus />
    <Kisses />
    <Hud />
    {DevMediaSwitcher ? (
      <Suspense fallback={null}>
        <DevMediaSwitcher />
      </Suspense>
    ) : null}
    {DevKiss ? (
      <Suspense fallback={null}>
        <DevKiss />
      </Suspense>
    ) : null}
  </>
);
