"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { browserClient } from "@/lib/supabase-browser";
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
  const fetchSeq = useRef(0);

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
    const mySeq = ++fetchSeq.current;
    try {
      const [boardRes, actRes] = await Promise.all([
        fetch(`/api/board?${params}`, { cache: "no-store" }),
        fetch("/api/activity", { cache: "no-store" }),
      ]);
      // a response for an older category/page must not clobber newer data
      if (mySeq !== fetchSeq.current) return;
      if (boardRes.ok) {
        const next = (await boardRes.json()) as BoardPage;
        if (mySeq !== fetchSeq.current) return;
        const fingerprint = (d: BoardPage) =>
          d.rows.map((r) => `${r.id}:${r.total_paid}:${r.clicks}`).join("|") +
          `#${d.total}#${d.topTotalCents}`;
        if (fingerprint(next) !== fingerprint(dataRef.current)) {
          const prevById = new Map(
            dataRef.current.rows.map((r) => [r.id, r.total_paid])
          );
          for (const row of next.rows) {
            const prev = prevById.get(row.id);
            if (prev === undefined || prev !== row.total_paid) glowRow(row.id);
          }
          setData(next);
        }
      }
      if (actRes.ok) {
        const json = (await actRes.json()) as { activity: ActivityItem[] };
        if (mySeq !== fetchSeq.current) return;
        if (json.activity) {
          setActivity((prev) =>
            prev[0]?.id === json.activity[0]?.id &&
            prev.length === json.activity.length
              ? prev
              : json.activity
          );
        }
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
      activeTimeouts.clear();
      // timers are gone, so no glow would ever clear itself
      setGlowing(new Set());
    };
  }, [refetch]);

  const totalRaisedCents = data.totals.reduce((sum, r) => sum + r.total_paid, 0);
  const top3 = data.rows.filter((r) => r.rank <= 3);
  const showStripAfterTop3 = !category && data.page === 1 && top3.length > 0;

  return (
    <>
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
      <BidBar bidCents={Math.max(500, data.topTotalCents + 100)} />
    </>
  );
}
