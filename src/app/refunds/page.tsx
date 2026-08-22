import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "refunds — thespot.lol" };

export default function Refunds() {
  return (
    <div className="page column">
      <h1>refund policy</h1>
      <p>
        all payments are final. you bought a spot on a leaderboard and you
        got one.
      </p>
      <p>
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
        your position is delivered the moment payment clears, and being
        outbid later is the product working as described, not a failure of
        delivery. if you were charged in error, for example a duplicate
        charge for a single checkout, write to{" "}
        <a href="mailto:support@thespot.lol">support@thespot.lol</a> and it
        will be looked at.
      </p>
      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
