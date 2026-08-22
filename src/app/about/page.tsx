import type { Metadata } from "next";
import Link from "next/link";
import { getStats } from "@/lib/board";
import { formatDollars } from "@/lib/rank";

export const metadata: Metadata = { title: "about — thespot.lol" };
export const dynamic = "force-dynamic";

export default async function About() {
  const stats = await getStats();
  return (
    <div className="page column">
      <h1>about</h1>
      <p>
        thespot.lol is a public leaderboard with one rule: your rank is the
        total amount of money you have paid. anyone can list a website or an
        @handle. anyone can pay more to move above the person in front of
        them. everyone watches the board move.
      </p>
      <p>
        there is no algorithm to game and no audience to please. there is
        just a number, and whether yours is bigger.
      </p>
      <p>launched august 2026.</p>
      <h2>the board right now</h2>
      {stats.total_listings > 0 ? (
        <>
          <p className="stat-line">{stats.total_listings} listings on the board</p>
          <p className="stat-line">{formatDollars(stats.total_raised_cents)} paid in total</p>
          <p className="stat-line">{formatDollars(stats.top_bid_cents)} holds the top spot</p>
        </>
      ) : (
        <p className="stat-line">the top spot is unclaimed. $5 takes it.</p>
      )}
      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
