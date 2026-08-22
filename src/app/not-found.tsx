import Link from "next/link";

export default function NotFound() {
  return (
    <div className="return-page">
      <h1>nothing at this address.</h1>
      <p className="return-sub">the board, however, is very much still going.</p>
      <Link href="/" className="btn return-btn">
        see the board
      </Link>
    </div>
  );
}
