import { useEffect, useState } from "react";

import { useReducedMotion } from "@/shared/motion";

const GLYPHS = "!<>-_\\/[]{}=+*^?#0123456789";

const SR_ONLY: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

interface ScrambleTextProps {
  text: string;
  /** ms before the decrypt starts. */
  delay?: number;
  /** ms per character resolution step. */
  step?: number;
  /** Gate: hold invisible until true (e.g. preloader exit). */
  active?: boolean;
}

/** Characters cycle through glyphs and settle left-to-right ("decrypt").
    Plain text renders under reduced motion (and in jsdom); while animating,
    assistive tech reads the real text from a visually-hidden copy. */
export function ScrambleText({ text, delay = 0, step = 28, active = true }: ScrambleTextProps) {
  const reduced = useReducedMotion();
  const skip = reduced === true;
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (skip || !active) return;
    let settled = 0;
    let intervalId = 0;
    const timeoutId = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        settled += 1;
        const head = text.slice(0, settled);
        const tail = text
          .slice(settled)
          .split("")
          .map((char) =>
            char === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)],
          )
          .join("");
        setDisplay(head + tail);
        if (settled >= text.length) window.clearInterval(intervalId);
      }, step);
    }, delay);
    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [text, delay, step, skip, active]);

  if (skip) {
    return <span>{text}</span>;
  }

  return (
    <span>
      <span style={SR_ONLY}>{text}</span>
      <span aria-hidden style={{ visibility: display === "" ? "hidden" : "visible" }}>
        {display === "" ? text : display}
      </span>
    </span>
  );
}
