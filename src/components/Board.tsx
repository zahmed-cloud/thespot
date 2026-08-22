"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { categoryLabel } from "@/lib/categories";
import { formatDollars, tierForRank } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";
import LogoTile from "./LogoTile";

const TILE_SIZE = { 1: 44, 2: 38, 3: 34, 4: 30 } as const;

/**
 * The board. Rows are cards. Metal treatments for #1/#2/#3, tier
 * dividers after 3, 10, and 20, FLIP reordering on the Apple curve,
 * and a quiet accent glow on freshly credited rows (ids in `glowing`).
 */
export default function Board({
  rows,
  glowing,
  afterTop3,
}: {
  rows: RankedListing[];
  glowing: Set<string>;
  afterTop3?: React.ReactNode;
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
      el.addEventListener(
        "transitionend",
        () => el.classList.remove("moving"),
        { once: true }
      );
    });

    prevRects.current = nextRects;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="empty-state">
        nobody has paid yet. five dollars owns the whole thing right now.
      </p>
    );
  }

  return (
    <ol className="board">
      {rows.map((row, i) => {
        const tier = tierForRank(row.rank);
        const prevRank = i > 0 ? rows[i - 1].rank : null;
        const classes = [
          "row",
          row.rank <= 3 ? `r${row.rank}` : `t${tier}`,
          glowing.has(row.id) ? "glow" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Fragment key={row.id}>
            {afterTop3 && prevRank !== null && prevRank <= 3 && row.rank > 3 && (
              <li className="strip-li">{afterTop3}</li>
            )}
            {prevRank !== null && prevRank <= 3 && row.rank > 3 && (
              <li className="tier-divider" aria-hidden="true">
                <span>4 — 10</span>
              </li>
            )}
            {prevRank !== null && prevRank <= 10 && row.rank > 10 && (
              <li className="tier-divider" aria-hidden="true">
                <span>11 — 20</span>
              </li>
            )}
            {prevRank !== null && prevRank <= 20 && row.rank > 20 && (
              <li className="tier-divider" aria-hidden="true">
                <span>21 and below</span>
              </li>
            )}
            <li
              className={classes}
              ref={(el) => {
                if (el) itemRefs.current.set(row.id, el);
                else itemRefs.current.delete(row.id);
              }}
            >
              <span className="rank" aria-label={`rank ${row.rank}`}>
                {row.rank}
              </span>
              <LogoTile
                faviconUrl={row.favicon_url}
                identityKey={row.identity_key}
                title={row.title}
                size={TILE_SIZE[tier]}
                lazy={row.rank > 20}
              />
              <div className="entry">
                <div className="entry-title">
                  <a href={`/r/${row.id}`} target="_blank" rel="nofollow noopener">
                    {row.title}
                  </a>
                </div>
                {row.description && (
                  <div className="entry-desc">{row.description}</div>
                )}
                <div className="entry-meta">
                  {timeAgo(row.updated_at)} · {categoryLabel(row.category)} ·{" "}
                  <a href={`/r/${row.id}`} target="_blank" rel="nofollow noopener">
                    {row.clicks.toLocaleString("en-US")} clicks ↗
                  </a>
                </div>
              </div>
              <span className="amount">{formatDollars(row.total_paid)}</span>
            </li>
          </Fragment>
        );
      })}
      {afterTop3 && rows[rows.length - 1].rank <= 3 && (
        <li className="strip-li">{afterTop3}</li>
      )}
    </ol>
  );
}

export function timeAgo(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
