"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { normalizeIdentity } from "@/lib/identity";
import { formatDollars, previewRank } from "@/lib/rank";
import type { BoardTotal } from "@/lib/types";
import DigitRoll from "./DigitRoll";

/**
 * The hero card. The number is the hero: the live price of #1 plus a
 * dollar, steppable, with rolling digits. The bid form sits under it.
 */
export default function Hero({
  totals,
  topTotalCents,
}: {
  totals: BoardTotal[];
  topTotalCents: number;
}) {
  const [bid, setBid] = useState(Math.max(5, Math.floor(topTotalCents / 100) + 1));
  const [bidTouched, setBidTouched] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // follow the live top price until the visitor takes the stepper over
  useEffect(() => {
    if (!bidTouched) setBid(Math.max(5, Math.floor(topTotalCents / 100) + 1));
  }, [topTotalCents, bidTouched]);

  const identity = useMemo(() => normalizeIdentity(url), [url]);
  const existing = useMemo(
    () =>
      identity
        ? totals.find((r) => r.identity_key === identity.identityKey) ?? null
        : null,
    [identity, totals]
  );
  const minimum = existing ? 1 : 5;

  const preview = useMemo(() => {
    if (url.trim() && !identity) return "that does not look like a url or handle.";
    const prospective = (existing?.total_paid ?? 0) + bid * 100;
    const rank = previewRank(totals, prospective, existing);
    const landing =
      rank === 1
        ? "this takes #1. someone will take it back."
        : `this puts you at #${rank}.`;
    if (existing) {
      const existingRank = previewRank(totals, existing.total_paid, existing);
      return `you are at ${formatDollars(existing.total_paid)} (#${existingRank}). ${landing}`;
    }
    return landing;
  }, [url, identity, existing, bid, totals]);

  function step(delta: number) {
    setBidTouched(true);
    setBid((b) => Math.max(minimum, b + delta));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identity) {
      setError("that is not a url or an @handle.");
      return;
    }
    if (bid < minimum) {
      setError(`${formatDollars(minimum * 100)} minimum. whole dollars.`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          description: description.trim(),
          category,
          amount_dollars: bid,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? "did not go through. no money moved. try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("did not go through. no money moved. try again.");
      setSubmitting(false);
    }
  }

  const priceText = `$${bid.toLocaleString("en-US")}`;

  return (
    <section className="hero" id="bid">
      <div className="hero-card">
        <p className="hero-label">the top spot costs</p>
        <div className="hero-price-row">
          <button
            type="button"
            className="stepper"
            onClick={() => step(-1)}
            disabled={bid <= minimum}
            aria-label="one dollar less"
          >
            −
          </button>
          <span className="hero-price" aria-label={priceText}>
            <DigitRoll text={priceText} />
          </span>
          <button
            type="button"
            className="stepper"
            onClick={() => step(1)}
            aria-label="one dollar more"
          >
            +
          </button>
        </div>
        <p className="hero-sub">
          starts at $5. pay less than the top and you still land somewhere.
        </p>

        <form onSubmit={submit}>
          <div className="bid-form">
            <input
              id="bid-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="your url or @handle"
              aria-label="your url or @handle"
              required
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="category"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "opening checkout" : `bid ${formatDollars(bid * 100)}`}
            </button>
          </div>

          {identity && !existing && (
            <div className="hero-detail">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={60}
                placeholder="title (optional)"
                aria-label="title"
              />
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={140}
                placeholder="one line about it (optional)"
                aria-label="one line about it"
              />
            </div>
          )}

          <p className="hero-note">{preview}</p>
          {error && <p className="hero-error">{error}</p>}
          <p className="hero-hint">already up there? same url, pay the difference.</p>
        </form>
      </div>
    </section>
  );
}
