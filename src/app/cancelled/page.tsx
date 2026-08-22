import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "no money moved — thespot.lol",
  robots: { index: false },
};

export default function Cancelled() {
  return (
    <div className="return-page">
      <h1>no money moved. the board is still there.</h1>
      <p className="return-sub">your form is saved. pick up where you left off.</p>
      <Link href="/?restore=1" className="btn return-btn">
        back to the board
      </Link>
    </div>
  );
}
