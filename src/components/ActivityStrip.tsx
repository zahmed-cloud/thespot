"use client";

import { useEffect, useRef, useState } from "react";
import { formatDollars } from "@/lib/rank";
import type { ActivityItem } from "@/lib/types";
import { timeAgo } from "./Board";
import LogoTile from "./LogoTile";

/**
 * Five most recent bids on frosted glass. A new bid slides in from the
 * left while the oldest falls off the end.
 */
export default function ActivityStrip({ items }: { items: ActivityItem[] }) {
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const knownIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (knownIds.current === null) {
      knownIds.current = new Set(items.map((i) => i.id));
      return;
    }
    const fresh = items.filter((i) => !knownIds.current!.has(i.id));
    if (fresh.length === 0) return;
    fresh.forEach((i) => knownIds.current!.add(i.id));
    setFreshIds(new Set(fresh.map((i) => i.id)));
    const t = setTimeout(() => setFreshIds(new Set()), 450);
    return () => clearTimeout(t);
  }, [items]);

  if (items.length === 0) return null;

  return (
    <section className="activity" aria-label="latest bids">
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
            <LogoTile
              faviconUrl={item.favicon_url}
              identityKey={item.identity_key}
              title={item.title}
              size={28}
            />
            <div>
              <div className="a-title">{item.title}</div>
              <div className="a-meta">
                {item.rank ? `#${item.rank} · ` : ""}
                {formatDollars(item.bid_cents)} · {timeAgo(item.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
