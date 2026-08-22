import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "rules — thespot.lol",
  description: "the eleven rules of thespot.lol: rank is the total paid, $5 minimum, ties go to the older listing, all payments final.",
  alternates: { canonical: "/rules" },
};

export default function Rules() {
  return (
    <div className="page column">
      <h1>the rules</h1>
      <ol>
        <li>your rank is the total amount of money you have paid. nothing else. no algorithm, no votes, no reviews.</li>
        <li>a new listing costs a minimum of $5.</li>
        <li>after that, you can add money in $1 steps.</li>
        <li>whole dollars only. no cents.</li>
        <li>ties go to whoever got there first. the older listing keeps the higher rank.</li>
        <li>paying less than #1 still puts you on the board, at whatever rank that amount buys.</li>
        <li>entering the same url or @handle again tops up your existing listing. it never creates a second row.</li>
        <li>climbing costs only the difference. if you are at $5 and #1 sits at $10, taking #1 costs $6, not $11.</li>
        <li>listings never expire and are never removed.</li>
        <li>all payments are final and non-refundable. see <Link href="/refunds">refunds</Link>.</li>
        <li>every row shows a live count of outbound clicks.</li>
      </ol>
      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
