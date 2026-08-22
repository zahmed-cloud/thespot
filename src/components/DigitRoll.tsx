"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Rolling digits. Each character sits in its own overflow-hidden box;
 * on change the old digit rolls up and out while the new one rolls in
 * from below. 260ms on the Apple curve. Digits roll, they do not fade.
 */
export default function DigitRoll({ text }: { text: string }) {
  const prevRef = useRef(text);
  const prev = prevRef.current;
  useEffect(() => {
    prevRef.current = text;
  }, [text]);

  return (
    <>
      {text.split("").map((ch, i) => {
        const fromRight = text.length - i;
        const prevCh = prev[prev.length - fromRight];
        return <Digit key={fromRight} ch={ch} prevCh={prevCh} />;
      })}
    </>
  );
}

function Digit({ ch, prevCh }: { ch: string; prevCh: string | undefined }) {
  const [old, setOld] = useState<string | null>(null);
  const shown = useRef(ch);

  useEffect(() => {
    if (shown.current === ch) return;
    setOld(shown.current);
    shown.current = ch;
    const t = setTimeout(() => setOld(null), 280);
    return () => clearTimeout(t);
  }, [ch]);

  // first paint after a server render: no animation
  const rolling = old !== null || (prevCh !== undefined && prevCh !== ch);

  return (
    <span className="droll">
      {old !== null && (
        <span className="d-old" aria-hidden="true">
          {old}
        </span>
      )}
      <span className={`d-cur${rolling ? " rolling" : ""}`}>{ch}</span>
    </span>
  );
}
