"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { normalizeIdentity } from "@/lib/identity";
import { formatDollars, previewRank } from "@/lib/rank";
import type { BoardTotal } from "@/lib/types";

/**
 * The hero is the number, not the button. Shows the bid, initialised to
 * one dollar over the current #1, steppable in $1 increments with a
 * digit-tick animation. The one-line form sits under it.
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

  const helper = useMemo(() => {
    if (url.trim() && !identity) return "that does not look like a url or handle.";
    const prospective = (existing?.total_paid ?? 0) + bid * 100;
    const rank = previewRank(totals, prospective, existing);
    const landing =
      rank === 1 ? "this takes the top spot." : `this puts you at #${rank}.`;
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
        setError(json.error ?? "that did not go through. no money moved. try again.");
        setSubmitting(false);
        return;
      }
      window.location.href = json.url;
    } catch {
      setError("that did not go through. no money moved. try again.");
      setSubmitting(false);
    }
  }

  return (
    <section className="hero column">
      <p className="hero-kicker">
        {existing ? "your next bid" : "the top spot costs"}
      </p>
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
        <TickingPrice dollars={bid} />
        <button
          type="button"
          className="stepper"
          onClick={() => step(1)}
          aria-label="one dollar more"
        >
          +
        </button>
      </div>
      <p className="hero-note">
        new listings start at $5. paying less than the top still puts you on the board.
      </p>

      <form onSubmit={submit}>
        <div className="submit-line">
          <input
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
          <button className="cta" type="submit" disabled={submitting}>
            {submitting ? "opening checkout" : `bid ${formatDollars(bid * 100)}`}
          </button>
        </div>

        {identity && !existing && (
          <div className="submit-detail">
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

        <div className="helper">
          <strong>{helper}</strong>
        </div>
        {error && <p className="form-error">{error}</p>}
        <p className="helper">already listed? enter the same url and top up.</p>
      </form>
    </section>
  );
}

/** Renders the price as digits; a changed digit ticks in from below. */
function TickingPrice({ dollars }: { dollars: number }) {
  const text = `$${dollars.toLocaleString("en-US")}`;
  const prevRef = useRef(text);
  const prev = prevRef.current;
  useEffect(() => {
    prevRef.current = text;
  }, [text]);

  return (
    <span className="hero-price" aria-label={text}>
      {text.split("").map((ch, i) => {
        // compare aligned from the right so a length change only
        // animates the digits that actually changed
        const fromRight = text.length - i;
        const prevCh = prev[prev.length - fromRight];
        const changed = prevCh !== ch;
        return (
          <span key={`${fromRight}-${ch}`} className={`digit${changed ? " tick" : ""}`}>
            {ch}
          </span>
        );
      })}
    </span>
  );
}
