"use client";

import { useEffect, useRef, useState } from "react";
import { formatDollars } from "@/lib/rank";
import type { ActivityItem } from "@/lib/types";
import { timeAgo } from "./Board";
import Favicon from "./Favicon";

/**
 * Five most recent bids. Full-bleed band; a new bid slides in from the
 * left and the oldest falls off.
 */
export default function ActivityStrip({ items }: { items: ActivityItem[] }) {
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (knownIds.current === null) {
      // first paint: nothing animates
      knownIds.current = new Set(items.map((i) => i.id));
      return;
    }
    const fresh = items.filter((i) => !knownIds.current!.has(i.id));
    if (fresh.length === 0) return;
    fresh.forEach((i) => knownIds.current!.add(i.id));
    setFreshIds(new Set(fresh.map((i) => i.id)));
    const t = setTimeout(() => setFreshIds(new Set()), 400);
    return () => clearTimeout(t);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="activity">
      <div className="column">
        <p className="activity-label">
          <span className="live-dot" aria-hidden="true" />
          latest bids
        </p>
        <div className="activity-cards">
          {items.map((item) => (
            <div
              key={item.id}
              className={`activity-card${freshIds.has(item.id) ? " fresh" : ""}`}
            >
              <Favicon src={item.favicon_url} title={item.title} size={28} />
              <div>
                <div className="a-title">{item.title}</div>
                <div className="a-meta">
                  {item.rank ? `#${item.rank} · ` : ""}
                  <span className="money-figure">{formatDollars(item.bid_cents)}</span>
                  {" · "}
                  {timeAgo(item.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
