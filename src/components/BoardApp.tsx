"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { browserClient } from "@/lib/supabase-browser";
import { formatDollars, rankBoard } from "@/lib/rank";
import type { Listing, RankedListing } from "@/lib/types";
import Board from "./Board";
import SubmitForm from "./SubmitForm";

export default function BoardApp({ initialBoard }: { initialBoard: RankedListing[] }) {
  const [board, setBoard] = useState<RankedListing[]>(initialBoard);
  const [stamped, setStamped] = useState<Set<string>>(new Set());
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;
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

  const applyRows = useCallback(
    (rows: Listing[], withStamp: boolean) => {
      const prevById = new Map(boardRef.current.map((r) => [r.id, r]));
      const ranked = rankBoard(rows);
      if (withStamp) {
        for (const row of ranked) {
          const prev = prevById.get(row.id);
          if (!prev || prev.total_paid !== row.total_paid) stampRow(row.id);
        }
      }
      setBoard(ranked);
    },
    [stampRow]
  );

  const mergeRow = useCallback(
    (row: Listing) => {
      const rest = boardRef.current.filter((r) => r.id !== row.id);
      applyRows([...rest, row], true);
    },
    [applyRows]
  );

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/board", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { board: RankedListing[] };
      if (json.board) applyRows(json.board, true);
    } catch {
      // board keeps its last known state; next poll retries
    }
  }, [applyRows]);

  // realtime subscription, with a 10s poll as the reconciliation fallback
  useEffect(() => {
    const supabase = browserClient();
    const channel = supabase
      ?.channel("board")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "listings" },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const old = payload.old as Partial<Listing>;
            if (old.id) {
              applyRows(
                boardRef.current.filter((r) => r.id !== old.id),
                false
              );
            }
            return;
          }
          mergeRow(payload.new as Listing);
        }
      )
      .subscribe();

    const poll = setInterval(refetch, 10_000);
    const activeTimeouts = timeouts.current;
    return () => {
      clearInterval(poll);
      channel?.unsubscribe();
      activeTimeouts.forEach(clearTimeout);
    };
  }, [applyRows, mergeRow, refetch]);

  // post-checkout notice: /?paid=1&key=example.com
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") !== "1") return;
    const key = params.get("key");
    const row = key ? board.find((r) => r.identity_key === key) : null;
    setNotice(
      row
        ? `you are at #${row.rank}. someone will pass you.`
        : "payment received. your spot lands when it clears, usually within a minute."
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  const totalCents = board.reduce((sum, r) => sum + r.total_paid, 0);

  return (
    <>
      <header className="masthead column">
        <div className="masthead-top">
          <h1 className="masthead-name">thespot.lol</h1>
          <span className="masthead-total">
            total on the board{" "}
            <span className="money-figure">
              <TickingMoney cents={totalCents} />
            </span>
          </span>
        </div>
        <p className="masthead-tag">rank is the money. that is the whole thing.</p>
      </header>

      {notice && (
        <div className="notice column" role="status">
          {notice}
        </div>
      )}

      <div className="action-strip column">
        {formOpen ? (
          <SubmitForm board={board} onCancel={() => setFormOpen(false)} />
        ) : (
          <button className="cta" onClick={() => setFormOpen(true)}>
            put yourself on the board
            <span className="cta-price">from $5</span>
          </button>
        )}
      </div>

      <main className="column">
        <Board rows={board} stamped={stamped} />
      </main>
    </>
  );
}

/** The masthead total ticks up when the board moves. */
function TickingMoney({ cents }: { cents: number }) {
  const [shown, setShown] = useState(cents);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    const from = shownRef.current;
    if (from === cents) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(cents);
      return;
    }
    const start = performance.now();
    const duration = 500;
    let frame: number;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setShown(Math.round(from + (cents - from) * t));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [cents]);

  return <>{formatDollars(shown)}</>;
}
