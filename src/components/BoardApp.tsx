"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase-browser";
import { formatDollars, previewRank } from "@/lib/rank";
import type { ActivityItem, BoardPage } from "@/lib/types";
import ActivityStrip from "./ActivityStrip";
import Board from "./Board";
import CategoryChips from "./CategoryChips";
import FooterTotal from "./FooterTotal";
import Hero from "./Hero";
import Pagination from "./Pagination";

export default function BoardApp({
  initial,
  initialActivity,
  category,
}: {
  initial: BoardPage;
  initialActivity: ActivityItem[];
  category: string | null;
}) {
  const [data, setData] = useState<BoardPage>(initial);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [stamped, setStamped] = useState<Set<string>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const timeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const stampRow = useCallback((id: string) => {
    setStamped((prev) => new Set(prev).add(id));
    const existing = timeouts.current.get(id);
    if (existing) clearTimeout(existing);
    timeouts.current.set(
      id,
      setTimeout(() => {
        setStamped((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        timeouts.current.delete(id);
      }, 1140)
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
          if (prev === undefined || prev !== row.total_paid) stampRow(row.id);
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
  }, [category, stampRow]);

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

  // post-checkout notice: /?paid=1&key=example.com
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    const key = params.get("key");
    const row = key ? data.totals.find((r) => r.identity_key === key) : null;
    setNotice(
      row
        ? `you are at #${previewRank(data.totals, row.total_paid, row)}. someone will pass you.`
        : "payment received. your spot lands when it clears, usually within a minute."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const totalRaisedCents = data.totals.reduce((sum, r) => sum + r.total_paid, 0);
  const top3 = data.rows.filter((r) => r.rank <= 3);
  const showStripAfterTop3 = !category && data.page === 1 && top3.length > 0;

  return (
    <>
      <div className="counter-pill-wrap column">
        <span className="counter-pill">
          <span className="live-dot" aria-hidden="true" />
          {data.totals.length.toLocaleString("en-US")} listings ·{" "}
          {formatDollars(totalRaisedCents)} raised
        </span>
      </div>

      <Hero totals={data.totals} topTotalCents={data.topTotalCents} />

      <CategoryChips active={category} />

      {notice && (
        <div className="column">
          <div className="notice" role="status">
            {notice}
          </div>
        </div>
      )}

      <main className="board-section column">
        {!showStripAfterTop3 && <ActivityStrip items={activity} />}
        <Board
          rows={data.rows}
          stamped={stamped}
          afterTop3={showStripAfterTop3 ? <ActivityStrip items={activity} /> : null}
        />
        <Pagination
          page={data.page}
          total={data.total}
          perPage={data.perPage}
          category={category}
        />
      </main>

      <FooterTotal totalCents={totalRaisedCents} />
    </>
  );
}
