import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "terms — thespot.lol" };

export default function Terms() {
  return (
    <div className="page column">
      <h1 className="display">terms of service</h1>
      <p>by using thespot.lol or paying for a listing, you agree to these terms.</p>

      <h2>what you are buying</h2>
      <p>
        a payment buys a position on a public leaderboard. rank is determined
        solely by the total amount paid for a listing, with ties broken by
        listing age. your position can be passed by anyone who pays more, at
        any time, without notice. that is the product.
      </p>

      <h2>payments</h2>
      <p>
        payments are processed by polar, acting as merchant of record. all
        payments are final and non-refundable, as described in the{" "}
        <Link href="/refunds">refund policy</Link>. minimum $5 for a new
        listing, $1 for a top-up, whole dollars only.
      </p>

      <h2>listings</h2>
      <p>
        you may only list a website or handle you own or are authorised to
        promote. listings must not contain unlawful, hateful, deceptive, or
        adult content, malware, phishing, or anything that impersonates
        another person or business. we may edit or blank the title,
        description, or link of any listing that breaks these rules, without
        refund. the paid total and rank position are preserved where
        possible.
      </p>

      <h2>no warranties</h2>
      <p>
        the service is provided as is, without warranties of any kind. we do
        not guarantee uptime, traffic, clicks, or that the board makes any
        commercial sense at all. to the maximum extent permitted by law, our
        total liability to you is limited to the amount you paid in the
        ninety days before the claim.
      </p>

      <h2>changes</h2>
      <p>
        we may update these terms. continued use after a change means you
        accept the updated terms.
      </p>

      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
