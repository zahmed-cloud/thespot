"use client";

import { useMemo, useState } from "react";
import { normalizeIdentity } from "@/lib/identity";
import { formatDollars, previewRank } from "@/lib/rank";
import type { RankedListing } from "@/lib/types";

/**
 * The submit form. The live rank preview under the amount field is the
 * whole sales pitch: watching "this puts you at #7" become "#2" as the
 * number goes up is what makes people bid higher.
 */
export default function SubmitForm({
  board,
  onCancel,
}: {
  board: RankedListing[];
  onCancel: () => void;
}) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const identity = useMemo(() => normalizeIdentity(url), [url]);
  const existing = useMemo(
    () =>
      identity
        ? board.find((r) => r.identity_key === identity.identityKey) ?? null
        : null,
    [identity, board]
  );

  const minimum = existing ? 1 : 5;
  const amount = /^\d+$/.test(amountRaw.trim()) ? parseInt(amountRaw.trim(), 10) : null;

  const topupHelper = useMemo(() => {
    if (!existing) return null;
    const top = board[0];
    if (existing.rank === 1) {
      return `you are at #1 with ${formatDollars(existing.total_paid)}. paying more builds the moat.`;
    }
    const olderThanTop = new Date(existing.created_at) < new Date(top.created_at);
    const costCents = top.total_paid - existing.total_paid + (olderThanTop ? 0 : 100);
    return `you are at ${formatDollars(existing.total_paid)} (#${existing.rank}). taking #1 costs ${formatDollars(costCents)}.`;
  }, [existing, board]);

  const rankHelper = useMemo(() => {
    if (amount === null || amount < minimum) {
      return existing
        ? `$1 minimum to top up. whole dollars.`
        : `$5 minimum. whole dollars.`;
    }
    const prospective = (existing?.total_paid ?? 0) + amount * 100;
    const rank = previewRank(board, prospective, existing);
    return rank === 1 ? "this takes the top spot." : `this puts you at #${rank}.`;
  }, [amount, minimum, existing, board]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!identity) {
      setError("that is not a url or an @handle.");
      return;
    }
    if (!existing && title.trim().length === 0) {
      setError("give it a title.");
      return;
    }
    if (amount === null || amount < minimum) {
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
          title: title.trim() || existing?.title || "",
          description: description.trim(),
          amount_dollars: amount,
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
    <form className="form-wrap" onSubmit={submit} style={{ border: "none", padding: 0 }}>
      <div className="form-grid">
        <div className="full">
          <label htmlFor="f-url">website or @handle</label>
          <input
            id="f-url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or @you"
            autoFocus
            required
          />
          <div className="helper">
            {url.trim() && !identity && "that does not look like a url or handle."}
            {topupHelper && <strong>{topupHelper}</strong>}
          </div>
        </div>

        <div>
          <label htmlFor="f-title">title</label>
          <input
            id="f-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            placeholder={existing ? existing.title : "what is it"}
          />
        </div>

        <div>
          <label htmlFor="f-amount">amount in dollars</label>
          <input
            id="f-amount"
            className="money-input"
            type="text"
            inputMode="numeric"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder={String(minimum)}
            required
          />
          <div className="helper">
            <strong>{rankHelper}</strong>
          </div>
        </div>

        <div className="full">
          <label htmlFor="f-desc">one line about it</label>
          <input
            id="f-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={140}
            placeholder={existing?.description ?? "optional"}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="cta" type="submit" disabled={submitting}>
          {submitting
            ? "opening checkout"
            : existing
              ? "pay the difference"
              : "put yourself on the board"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: "none", border: "none", color: "var(--ink-soft)", fontSize: "var(--fs-14)" }}
        >
          never mind
        </button>
      </div>
      <p className="helper" style={{ marginTop: 12 }}>
        all payments are final. rank can always be taken by a bigger number.
      </p>
    </form>
  );
}
