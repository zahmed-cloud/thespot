"use client";

import { useEffect, useState } from "react";
import DigitRoll from "./DigitRoll";

const LAUNCH_AT = process.env.NEXT_PUBLIC_LAUNCH_AT ?? "2026-08-23T00:00:00Z";

/** The screenshot-bait number, with the same digit roll as the hero. */
export default function FooterTotal({ totalCents }: { totalCents: number }) {
  const [hours, setHours] = useState(() => hoursSinceLaunch());

  useEffect(() => {
    const t = setInterval(() => setHours(hoursSinceLaunch()), 60_000);
    return () => clearInterval(t);
  }, []);

  // pre-launch: no money, no band. it appears with the first payment.
  if (totalCents <= 0) return null;

  const text = `$${Math.round(totalCents / 100).toLocaleString("en-US")}`;

  return (
    <section className="total-band">
      {/* flat setup, then a very large number. the restraint is the flex. */}
      <p className="kicker">people have paid</p>
      <p className="big">
        <DigitRoll text={text} />
      </p>
      <p className="hours" suppressHydrationWarning>
        since it went up {hours.toLocaleString("en-US")}{" "}
        {hours === 1 ? "hour" : "hours"} ago
      </p>
    </section>
  );
}

function hoursSinceLaunch(): number {
  return Math.max(1, Math.floor((Date.now() - new Date(LAUNCH_AT).getTime()) / 36e5));
}
