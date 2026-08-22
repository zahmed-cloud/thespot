import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "refunds — thespot.lol" };

export default function Refunds() {
  return (
    <div className="page column">
      <h1 className="display">refund policy</h1>
      <p>all payments are final.</p>
      <p>
        you are buying a position on a leaderboard, and you already got it.
        the moment your payment clears, your listing is created or topped up
        and ranked accordingly. that is the entire product, delivered in
        full, instantly.
      </p>
      <p>
        your rank is not guaranteed to stay where it is. anyone can pay more
        and move above you at any time. losing rank to a higher bid is the
        product working as described, not grounds for a refund.
      </p>
      <p>
        if you were charged in error, for example a duplicate charge for a
        single checkout, contact support through the merchant of record,
        polar, using the receipt in your email, and it will be looked at.
      </p>
      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
