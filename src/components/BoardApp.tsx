"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { browserClient } from "@/lib/supabase-browser";
import { formatDollars } from "@/lib/rank";
import type { ActivityItem, BoardPage } from "@/lib/types";
import ActivityStrip from "./ActivityStrip";
import BidBar from "./BidBar";
import Board from "./Board";
import FooterTotal from "./FooterTotal";
import Hero from "./Hero";
import Pagination from "./Pagination";

export default function BoardApp({
  initial,
  initialActivity,
  category,
  categoryBar,
}: {
  initial: BoardPage;
  initialActivity: ActivityItem[];
  category: string | null;
  categoryBar: React.ReactNode;
}) {
  const [data, setData] = useState<BoardPage>(initial);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [glowing, setGlowing] = useState<Set<string>>(new Set());
  const dataRef = useRef(data);
  dataRef.current = data;
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // navigation lands a fresh server render; sync it in without remounting
  useEffect(() => {
    setData(initial);
    setActivity(initialActivity);
  }, [initial, initialActivity]);

  const glowRow = useCallback((id: string) => {
    setGlowing((prev) => new Set(prev).add(id));
    const existing = timeouts.current.get(id);
    if (existing) clearTimeout(existing);
    timeouts.current.set(
      id,
      setTimeout(() => {
        setGlowing((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timeouts.current.delete(id);
      }, 720)
    );
  }, []);

  const refetch = useCallback(async () => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (dataRef.current.page > 1) params.set("page", String(dataRef.current.page));
    try {
      const [boardRes, actRes] = await Promise.all([
        fetch(`/api/board?${params}`, { cache: "no-store" }),
        fetch("/api/activity", { cache: "no-store" }),
      ]);
      if (boardRes.ok) {
        const next = (await boardRes.json()) as BoardPage;
        const prevById = new Map(
          dataRef.current.rows.map((r) => [r.id, r.total_paid])
        );
        for (const row of next.rows) {
          const prev = prevById.get(row.id);
          if (prev === undefined || prev !== row.total_paid) glowRow(row.id);
        }
        setData(next);
      }
      if (actRes.ok) {
        const json = (await actRes.json()) as { activity: ActivityItem[] };
        if (json.activity) setActivity(json.activity);
      }
    } catch {
      // keep last known state; the next poll retries
    }
  }, [category, glowRow]);

  // realtime nudges a debounced refetch; a 10s poll is the fallback
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const nudge = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(refetch, 250);
    };

    const supabase = browserClient();
    const channel = supabase
      ?.channel("board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        nudge
      )
      .subscribe();

    const poll = setInterval(refetch, 10_000);
    const activeTimeouts = timeouts.current;
    return () => {
      if (debounce) clearTimeout(debounce);
      clearInterval(poll);
      channel?.unsubscribe();
      activeTimeouts.forEach(clearTimeout);
    };
  }, [refetch]);

  const totalRaisedCents = data.totals.reduce((sum, r) => sum + r.total_paid, 0);
  const top3 = data.rows.filter((r) => r.rank <= 3);
  const showStripAfterTop3 = !category && data.page === 1 && top3.length > 0;

  return (
    <>
      <div className="live-wrap">
        <span className="live-pill">
          <span className="live-dot" aria-hidden="true" />
          <span className="mono">{data.totals.length.toLocaleString("en-US")}</span>
          listings
          <span aria-hidden="true">·</span>
          <span className="mono">{formatDollars(totalRaisedCents)}</span>
          raised
        </span>
      </div>

      <Hero totals={data.totals} topTotalCents={data.topTotalCents} />

      {categoryBar}

      <main className="board-section container">
        {!showStripAfterTop3 && <ActivityStrip items={activity} />}
        <Board
          rows={data.rows}
          glowing={glowing}
          afterTop3={showStripAfterTop3 ? <ActivityStrip items={activity} /> : null}
          categoryLabelText={category ? categoryLabel(category) : null}
        />
        <Pagination
          page={data.page}
          total={data.total}
          perPage={data.perPage}
          category={category}
        />
      </main>

      <FooterTotal totalCents={totalRaisedCents} />
      <BidBar bidCents={data.topTotalCents + 100} />
    </>
  );
}
