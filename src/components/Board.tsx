"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { categoryLabel } from "@/lib/categories";
import { formatDollars, tierForRank } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";
import Favicon from "./Favicon";

/**
 * The board. Four visual tiers driven by rank, tier divider pills after
 * #10 and #20, FLIP reordering, and the PAID stamp on freshly credited
 * rows (ids present in `stamped`).
 */
export default function Board({
  rows,
  stamped,
  afterTop3,
}: {
  rows: RankedListing[];
  stamped: Set<string>;
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
      {rows.map((row, i) => {
        const tier = tierForRank(row.rank);
        const prevRank = i > 0 ? rows[i - 1].rank : null;
        const classes = [
          "board-row",
          `t${tier}`,
          row.rank === 1 ? "r1" : "",
          tier === 1 && (i === rows.length - 1 || tierForRank(rows[i + 1].rank) !== 1)
            ? "t1-last"
            : "",
          tier === 4 && row.rank % 2 === 0 ? "alt" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <Fragment key={row.id}>
            {afterTop3 && prevRank !== null && prevRank <= 3 && row.rank > 3 && (
              <li className="strip-li">{afterTop3}</li>
            )}
            {prevRank !== null && prevRank <= 10 && row.rank > 10 && (
              <li className="tier-divider" aria-hidden="true">
                <span>top 10</span>
              </li>
            )}
            {prevRank !== null && prevRank <= 20 && row.rank > 20 && (
              <li className="tier-divider" aria-hidden="true">
                <span>top 20</span>
              </li>
            )}
            <li
              className={classes}
              ref={(el) => {
                if (el) itemRefs.current.set(row.id, el);
                else itemRefs.current.delete(row.id);
              }}
            >
              <span className="rank display" aria-label={`rank ${row.rank}`}>
                {tier <= 2 ? (
                  <span className="rank-badge display">#{row.rank}</span>
                ) : (
                  <>#{row.rank}</>
                )}
              </span>
              <Favicon src={row.favicon_url} title={row.title} />
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
                    {row.clicks.toLocaleString("en-US")} ▸
                  </a>
                </div>
              </div>
              <span className="amount">
                {formatDollars(row.total_paid)}
                {stamped.has(row.id) && (
                  <span className="stamp-mark" aria-hidden="true">
                    PAID
                  </span>
                )}
              </span>
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
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
