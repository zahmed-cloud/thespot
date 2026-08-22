"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import { normalizeIdentity } from "@/lib/identity";
import { formatDollars, previewRank } from "@/lib/rank";
import type { BoardTotal } from "@/lib/types";

const MAX_DIGITS = 7;

/**
 * The hero card. The price is a real text input styled as display text:
 * click it, type any number, commas land live, the caret stays put.
 * Steppers write into the same state. The digit-roll animation is for
 * values arriving from the realtime channel, never for keystrokes.
 */
export default function Hero({
  totals,
  topTotalCents,
}: {
  totals: BoardTotal[];
  topTotalCents: number;
}) {
  // raw digits only; the input shows the comma-formatted version
  const [raw, setRaw] = useState(() =>
    String(Math.max(5, Math.floor(topTotalCents / 100) + 1))
  );
  const [bidTouched, setBidTouched] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [extRoll, setExtRoll] = useState(false);
  const [firstPulse, setFirstPulse] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  const bid = parseInt(raw || "0", 10);
  const formatted = bid > 0 ? bid.toLocaleString("en-US") : raw;

  // follow the live top price until the visitor takes the number over.
  // external arrivals roll; keystrokes never do.
  const shownExt = useRef<string | null>(null);
  const extTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (bidTouched) return;
    const next = String(Math.max(5, Math.floor(topTotalCents / 100) + 1));
    if (shownExt.current === null) {
      shownExt.current = next; // first paint: no animation
      return;
    }
    if (shownExt.current === next) return;
    shownExt.current = next;
    setRaw(next);
    // restart the roll cleanly even when updates arrive back to back
    setExtRoll(false);
    requestAnimationFrame(() => setExtRoll(true));
    if (extTimer.current) clearTimeout(extTimer.current);
    extTimer.current = setTimeout(() => setExtRoll(false), 300);
  }, [topTotalCents, bidTouched]);

  useEffect(
    () => () => {
      if (extTimer.current) clearTimeout(extTimer.current);
    },
    []
  );

  // one-time first-visit affordance: a pulse and a dashed "this is
  // editable" underline that fades after 4s. never seen again.
  useEffect(() => {
    if (localStorage.getItem("spot-priced")) return;
    localStorage.setItem("spot-priced", "1");
    setFirstPulse(true);
    setFirstVisit(true);
    const t1 = setTimeout(() => setFirstPulse(false), 700);
    const t2 = setTimeout(() => setFirstVisit(false), 4600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // returning from /cancelled: restore what they had typed
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has("restore")) return;
    try {
      const saved = JSON.parse(sessionStorage.getItem("spot-form") ?? "null");
      if (!saved) return;
      setUrl(saved.url ?? "");
      setTitle(saved.title ?? "");
      setDescription(saved.description ?? "");
      setCategory(saved.category ?? "other");
      if (saved.raw) {
        setRaw(String(saved.raw));
        setBidTouched(true);
      }
    } catch {
      // a corrupt saved form is not worth surfacing
    }
  }, []);

  // restore the caret after a formatting re-render
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (el && pendingCaret.current !== null) {
      el.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [formatted]);

  const identity = useMemo(() => normalizeIdentity(url), [url]);
  const existing = useMemo(
    () =>
      identity
        ? totals.find((r) => r.identity_key === identity.identityKey) ?? null
        : null,
    [identity, totals]
  );
  const minimum = existing ? 1 : 5;

  const costToTopDollars = useMemo(() => {
    if (!existing) return null;
    const top = totals.reduce(
      (best, r) =>
        r.total_paid > best.total_paid ||
        (r.total_paid === best.total_paid &&
          new Date(r.created_at) < new Date(best.created_at))
          ? r
          : best,
      totals[0]
    );
    if (top.identity_key === existing.identity_key) return 0;
    const older = new Date(existing.created_at) < new Date(top.created_at);
    return (top.total_paid - existing.total_paid) / 100 + (older ? 0 : 1);
  }, [existing, totals]);

  const preview = useMemo(() => {
    if (url.trim() && !identity) return "that does not look like a url or handle.";
    if (existing) {
      if (costToTopDollars === 0) {
        return `you are #1 at ${formatDollars(existing.total_paid)}. paying more builds the moat.`;
      }
      const prospective = existing.total_paid + bid * 100;
      if (previewRank(totals, prospective, existing) === 1) {
        return "this takes #1. someone will take it back.";
      }
      return `you are at ${formatDollars(existing.total_paid)}. taking #1 costs ${formatDollars((costToTopDollars ?? 0) * 100)}.`;
    }
    if (!bidTouched) {
      // the strongest argument for a small bid: a live, real rank for $5
      return `$5 puts you at #${previewRank(totals, 500, null)} right now.`;
    }
    const rank = previewRank(totals, bid * 100, null);
    return rank === 1
      ? "this takes #1. someone will take it back."
      : `${formatDollars(bid * 100)} puts you at #${rank}.`;
  }, [url, identity, existing, bid, bidTouched, totals, costToTopDollars]);

  function writeBid(next: number) {
    setBidTouched(true);
    setRaw(String(Math.max(minimum, next)));
  }

  function handlePriceInput(e: React.ChangeEvent<HTMLInputElement>) {
    const el = e.target;
    // count digits left of the caret, reformat, then put the caret back
    // after the same number of digits
    const digitsBeforeCaret = el.value
      .slice(0, el.selectionStart ?? 0)
      .replace(/\D/g, "").length;
    const digits = el.value.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, MAX_DIGITS);

    const parsed = parseInt(digits || "0", 10);
    const nextFormatted = parsed > 0 ? parsed.toLocaleString("en-US") : digits;
    let pos = 0;
    let seen = 0;
    while (pos < nextFormatted.length && seen < digitsBeforeCaret) {
      if (/\d/.test(nextFormatted[pos])) seen++;
      pos++;
    }
    pendingCaret.current = pos;

    setBidTouched(true);
    setRaw(digits);
  }

  function handlePriceBlur() {
    if (bid < minimum) setRaw(String(minimum));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identity) {
      setError("that is not a url or an @handle.");
      return;
    }
    const amount = Math.max(minimum, bid);
    if (bid < minimum) setRaw(String(minimum));

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
          amount_dollars: amount,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        setError(json.error ?? "could not start checkout. no money moved.");
        setSubmitting(false);
        return;
      }
      // keep the form recoverable if they back out at polar
      sessionStorage.setItem(
        "spot-form",
        JSON.stringify({ url: url.trim(), title, description, category, raw })
      );
      window.location.href = json.url;
    } catch {
      setError("could not start checkout. no money moved.");
      setSubmitting(false);
    }
  }

  return (
    <section className="hero" id="bid">
      <div className="hero-card">
        <form onSubmit={submit}>
          <h1 className="hero-label">the top spot costs</h1>
          <div className="hero-price-row">
            <button
              type="button"
              className="stepper"
              onClick={() => writeBid(bid - 1)}
              disabled={bid <= minimum}
              aria-label="lower the bid"
            >
              −
            </button>
            <span
              className={`hero-price${extRoll ? " ext-roll" : ""}${firstPulse ? " first-pulse" : ""}${firstVisit ? " first-visit" : ""}`}
              onClick={() => inputRef.current?.focus()}
            >
              <span aria-hidden="true">$</span>
              <input
                ref={inputRef}
                inputMode="numeric"
                autoComplete="off"
                value={formatted}
                onChange={handlePriceInput}
                onBlur={handlePriceBlur}
                aria-label="bid amount in dollars"
                style={{ width: `${Math.max(1, formatted.length)}ch` }}
              />
            </span>
            <button
              type="button"
              className="stepper"
              onClick={() => writeBid(bid + 1)}
              aria-label="raise the bid"
            >
              +
            </button>
          </div>
          <p className="hero-sub">
            this is just the top.
            <span className="instruction">type any number — $5 gets you listed.</span>
          </p>

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
              {submitting
                ? "opening checkout"
                : `bid ${formatDollars(Math.max(minimum, bid) * 100)}`}
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

          <p className="hero-note" role="status" aria-live="polite">
            {preview}
          </p>
          {error && (
            <p className="hero-error" role="alert">
              {error}
            </p>
          )}
        </form>
      </div>
    </section>
  );
}
