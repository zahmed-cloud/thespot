"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { categoryLabel } from "@/lib/categories";
import { formatDollars, tierForRank } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";
import LogoTile from "@/components/LogoTile";

const SUPPORT_EMAIL = "support@thespot.lol";
const POLL_MS = 1500;
const TIMEOUT_MS = 20_000;

type State =
  | { kind: "polling" }
  | { kind: "credited"; rank: number; listing: RankedListing }
  | { kind: "slow" };

/**
 * The post-payment landing. Polls listing-status until the webhook
 * lands, then shows the buyer their rank and their row exactly as it
 * appears on the board. A slow webhook is never presented as an error:
 * the money is fine, the board is just catching up.
 */
export default function SuccessClient() {
  const [state, setState] = useState<State>({ kind: "polling" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const query = new URLSearchParams();
    const checkoutId = params.get("checkout_id");
    const ref = params.get("ref");
    if (checkoutId) query.set("checkout_id", checkoutId);
    if (ref) query.set("ref", ref);

    // a completed checkout means the saved form is spent
    sessionStorage.removeItem("spot-form");

    let stopped = false;
    const startedAt = Date.now();

    async function poll() {
      if (stopped) return;
      try {
        const res = await fetch(`/api/listing-status?${query}`, { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (json.status === "credited" && json.listing) {
            setState({ kind: "credited", rank: json.rank, listing: json.listing });
            return;
          }
        }
      } catch {
        // treat as pending; the next poll retries
      }
      if (Date.now() - startedAt >= TIMEOUT_MS) {
        setState({ kind: "slow" });
        return;
      }
      setTimeout(poll, POLL_MS);
    }

    poll();
    return () => {
      stopped = true;
    };
  }, []);

  return (
    <div className="return-page">
      {state.kind === "polling" && (
        <>
          <span className="live-dot big" aria-hidden="true" />
          <h1>payment cleared. putting you on the board...</h1>
          <p className="return-sub">this usually takes a few seconds.</p>
        </>
      )}

      {state.kind === "credited" && (
        <>
          <h1>you are #{state.rank}. enjoy it while it lasts.</h1>
          <SuccessRow row={state.listing} />
          <Link href="/" className="btn return-btn">
            see the board
          </Link>
        </>
      )}

      {state.kind === "slow" && (
        <>
          <h1>payment went through. the board will catch up in a minute.</h1>
          <p className="return-sub">
            if your listing is not up in ten minutes, write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and it gets
            sorted.
          </p>
          <Link href="/" className="btn return-btn">
            see the board
          </Link>
        </>
      )}
    </div>
  );
}

/** The buyer's row, rendered exactly as it appears on the board. */
function SuccessRow({ row }: { row: RankedListing }) {
  const tier = tierForRank(row.rank);
  const size = { 1: 44, 2: 38, 3: 34, 4: 30 }[tier];
  const cls = row.rank <= 3 ? `r${row.rank}` : `t${tier}`;
  return (
    <div className="return-row">
      <div className={`row ${cls}`}>
        <span className="rank">{row.rank}</span>
        <LogoTile
          faviconUrl={row.favicon_url}
          identityKey={row.identity_key}
          title={row.title}
          size={size}
        />
        <div className="entry">
          <div className="entry-title">{row.title}</div>
          {row.description && <div className="entry-desc">{row.description}</div>}
          <div className="entry-meta">
            just now · {categoryLabel(row.category)} ·{" "}
            {row.clicks.toLocaleString("en-US")} clicks
          </div>
        </div>
        <span className="amount">{formatDollars(row.total_paid)}</span>
      </div>
    </div>
  );
}
