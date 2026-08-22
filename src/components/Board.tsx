"use client";

import { useLayoutEffect, useRef } from "react";
import { formatDollars } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";

/**
 * The ledger. Rows FLIP-animate into their new rank position when the
 * board reorders; a freshly credited row gets the PAID stamp over its
 * amount column (rendered when its id is in `stamped`).
 */
export default function Board({
  rows,
  stamped,
}: {
  rows: RankedListing[];
  stamped: Set<string>;
}) {
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevRects = useRef<Map<string, DOMRect>>(new Map());

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextRects = new Map<string, DOMRect>();

    itemRefs.current.forEach((el, id) => {
      const rect = el.getBoundingClientRect();
      nextRects.set(id, rect);
      if (reduced) return;

      const prev = prevRects.current.get(id);
      if (!prev) return;
      const dy = prev.top - rect.top;
      if (Math.abs(dy) < 1) return;

      // FLIP: jump to the old position, then transition to none
      el.classList.remove("moving");
      el.style.transform = `translateY(${dy}px)`;
      void el.offsetHeight;
      el.classList.add("moving");
      el.style.transform = "";
    });

    prevRects.current = nextRects;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="empty-state">
        nobody has paid yet. first one in takes the top for five dollars.
      </p>
    );
  }

  return (
    <ol className="board">
      {rows.map((row) => (
        <li
          key={row.id}
          className={`board-row${row.rank === 1 ? " top" : ""}`}
          ref={(el) => {
            if (el) itemRefs.current.set(row.id, el);
            else itemRefs.current.delete(row.id);
          }}
        >
          <span className="rank display" aria-label={`rank ${row.rank}`}>
            #{row.rank}
          </span>
          <div className="entry">
            <div className="entry-line">
              <span className="entry-title">{row.title}</span>
              <a
                className="entry-url data"
                href={`/r/${row.id}`}
                target="_blank"
                rel="nofollow noopener"
              >
                {row.display_url.replace(/^https?:\/\//, "")} ▸
              </a>
            </div>
            {row.description && <div className="entry-desc">{row.description}</div>}
          </div>
          <span className="amount">
            {formatDollars(row.total_paid)}
            {stamped.has(row.id) && (
              <span className="stamp-mark" aria-hidden="true">
                PAID
              </span>
            )}
          </span>
          <span className="meta">
            <span className="clicks">{row.clicks.toLocaleString("en-US")} clicks</span>
            {timeAgo(row.updated_at)}
          </span>
        </li>
      ))}
    </ol>
  );
}

function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
