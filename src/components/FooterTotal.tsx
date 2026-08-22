"use client";

import { useEffect, useState } from "react";
import { formatDollars } from "@/lib/rank";

const LAUNCH_AT =
  process.env.NEXT_PUBLIC_LAUNCH_AT ?? "2026-08-23T00:00:00Z";

/** The screenshot-bait number. Hours since launch tick live. */
export default function FooterTotal({ totalCents }: { totalCents: number }) {
  const [hours, setHours] = useState(() => hoursSinceLaunch());

  useEffect(() => {
    const t = setInterval(() => setHours(hoursSinceLaunch()), 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="total-band">
      <p className="kicker">this stupid little board has taken</p>
      <p className="big">{formatDollars(totalCents)}</p>
      <p className="hours">
        in {hours.toLocaleString("en-US")} {hours === 1 ? "hour" : "hours"}
      </p>
    </section>
  );
}

function hoursSinceLaunch(): number {
  return Math.max(1, Math.floor((Date.now() - new Date(LAUNCH_AT).getTime()) / 36e5));
}
