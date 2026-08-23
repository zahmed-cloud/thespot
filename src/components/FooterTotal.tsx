"use client";

import { useEffect, useState } from "react";
import DigitRoll from "./DigitRoll";

/**
 * The screenshot-bait number. Appears only once real money exists, and
 * the clock counts from the actual first payment (the oldest listing's
 * created_at) — real time, true time, no config, no lies.
 */
export default function FooterTotal({
  totalCents,
  firstPaidAt,
}: {
  totalCents: number;
  firstPaidAt: string | null;
}) {
  const [, tick] = useState(0);

  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  // pre-launch: no money, no band. it appears with the first payment.
  if (totalCents <= 0 || !firstPaidAt) return null;

  const text = `$${Math.round(totalCents / 100).toLocaleString("en-US")}`;

  return (
    <section className="total-band">
      {/* flat setup, then a very large number. the restraint is the flex. */}
      <p className="kicker">people have paid</p>
      <p className="big">
        <DigitRoll text={text} />
      </p>
      <p className="hours" suppressHydrationWarning>
        since it went up {elapsed(firstPaidAt)} ago
      </p>
    </section>
  );
}

function elapsed(iso: string): string {
  const mins = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `${mins} ${mins === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(mins / 60);
  return `${hours.toLocaleString("en-US")} ${hours === 1 ? "hour" : "hours"}`;
}
