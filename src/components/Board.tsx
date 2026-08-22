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
  categoryLabelText,
}: {
  rows: RankedListing[];
  glowing: Set<string>;
  afterTop3?: React.ReactNode;
  categoryLabelText?: string | null;
}) {
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());
  const prevTops = useRef<Map<string, number>>(new Map());

  useLayoutEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextTops = new Map<string, number>();

    itemRefs.current.forEach((el, id) => {
      // document-space position: viewport rects change when the user
      // scrolls, which is not a move
      const top = el.getBoundingClientRect().top + window.scrollY;
      nextTops.set(id, top);
      if (reduced) return;

      const prev = prevTops.current.get(id);
      if (prev === undefined) return;
      const dy = prev - top;
      if (Math.abs(dy) < 1) return;

      // FLIP: snap without ANY transition (the base .row hover
      // transition would otherwise animate the snap away), then play
      el.classList.remove("moving");
      el.style.transition = "none";
      el.style.transform = `translateY(${dy}px)`;
      void el.offsetHeight;
      el.style.transition = "";
      el.classList.add("moving");
      el.style.transform = "";
      el.addEventListener(
        "transitionend",
        () => el.classList.remove("moving"),
        { once: true }
      );
    });

    prevTops.current = nextTops;
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="empty-state">
        {categoryLabelText ? (
          <>
            <p className="empty-big">{categoryLabelText} has no king yet.</p>
            <p className="empty-sub">
              $5 takes #1 in {categoryLabelText} right now. whole category, one
              bill. move before someone else does.
            </p>
          </>
        ) : (
          <>
            <p className="empty-big">the entire board is up for grabs.</p>
            <p className="empty-sub">
              be the first name up here. $5 crowns you the first #1 in thespot.lol history.
              <span className="empty-line2">it will never be this cheap again.</span>
            </p>
          </>
        )}
      </div>
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
                <div className="entry-meta" suppressHydrationWarning>
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
