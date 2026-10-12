// The HUD, as HTML over the scene:
//   bottom     a hint pill above the title: look at the camera → blow a kiss;
//              gone after the first kiss
//   top-right  the speaker (sound starts muted: the SDK's rule for iOS, and
//              the tap that unmutes is the gesture that unlocks playback)
// React state changes only when what's shown does.
import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { toggleMuted, useMuted } from "@vincentt-xr/sdk";

import { loadSounds } from "./sound";
import { kissState } from "./state";

type Hint = { icon: string; text: string } | null;

const hintNow = (): Hint => {
  if (kissState.sent > 0) return null;
  if (!kissState.face) return { icon: "🙂", text: "Look at the camera" };
  return { icon: "😘", text: "Blow a kiss!" };
};

export const Hud = () => {
  const muted = useMuted();
  const [hint, setHint] = useState<Hint>(null);

  useEffect(() => {
    loadSounds().catch(() => {
      // A clip that fails to load just stays silent.
    });
    const id = window.setInterval(() => {
      const next = hintNow();
      setHint((h) => (h?.text === next?.text ? h : next));
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Html fullscreen zIndexRange={[30, 0]} style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          fontFamily: '"Nunito", "Space Grotesk", system-ui, sans-serif',
        }}
      >
        <div
          aria-live="polite"
          style={{
            position: "absolute",
            bottom: "17%",
            left: "50%",
            transform: `translate(-50%, ${hint ? 0 : -10}px)`,
            opacity: hint ? 1 : 0,
            transition: "opacity 0.5s, transform 0.5s",
            maxWidth: "min(76vw, 400px)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 18px",
            borderRadius: 999,
            background: "rgba(255, 255, 255, 0.42)",
            border: "1.5px solid rgba(255, 255, 255, 0.85)",
            boxShadow: "0 6px 24px rgba(220, 40, 110, 0.25)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            color: "#c2185b",
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1.25,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 22 }}>{hint?.icon}</span>
          <span>{hint?.text}</span>
        </div>

        <button
          type="button"
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          onClick={toggleMuted}
          style={{
            position: "absolute",
            top: 16,
            right: 14,
            width: 46,
            height: 46,
            borderRadius: 23,
            border: "1.5px solid rgba(255, 255, 255, 0.85)",
            background: "rgba(255, 255, 255, 0.42)",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            boxShadow: "0 6px 20px rgba(220, 40, 110, 0.25)",
            fontSize: 21,
            pointerEvents: "auto",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {muted ? "🔇" : "🔊"}
        </button>
      </div>
    </Html>
  );
};
