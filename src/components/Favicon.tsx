"use client";

import { useEffect, useState } from "react";

/**
 * Favicon square with the letter-square fallback. Explicit width/height
 * always, so the board never shifts while images load. x: handles never
 * get a favicon url, so they always render the letter square.
 */
export default function Favicon({
  src,
  title,
  size,
}: {
  src: string | null;
  title: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  const letter = (title.replace(/^@/, "").trim()[0] ?? "?").toLowerCase();
  const style = size ? { ["--fav" as string]: `${size}px` } : undefined;

  if (!src || failed) {
    return (
      <span className="fav-letter" style={style} aria-hidden="true">
        {letter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="fav"
      style={style}
      src={src}
      alt=""
      width={size ?? 32}
      height={size ?? 32}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
