"use client";

import { formatDollars } from "@/lib/rank";

/**
 * Mobile-only sticky bid bar. Frosted, above the safe area, shows the
 * live price and jumps to the bid form. Hidden at >=768px by CSS.
 */
export default function BidBar({ bidCents }: { bidCents: number }) {
  function jump() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("bid")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    setTimeout(() => document.getElementById("bid-url")?.focus(), reduced ? 0 : 450);
  }

  return (
    <div className="bidbar">
      <div>
        <span className="bb-label">the top spot costs</span>
        <span className="bb-price">{formatDollars(bidCents)}</span>
      </div>
      <button className="btn" onClick={jump}>
        take it
      </button>
    </div>
  );
}
