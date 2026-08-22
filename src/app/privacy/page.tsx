import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "privacy — thespot.lol" };

export default function Privacy() {
  return (
    <div className="page column">
      <h1>privacy policy</h1>

      <h2>what we collect</h2>
      <p>
        listings are public by design: the url or handle, title, description,
        amount paid, and click count are visible to everyone. that is the
        product.
      </p>
      <p>
        when you pay, checkout is handled by polar as merchant of record.
        polar collects your payment details and billing information under its
        own privacy policy. we receive the order details needed to credit
        your listing, and we store them.
      </p>
      <p>
        when you click an outbound link on the board, we store a salted hash
        of your ip address for click counting and abuse prevention. we cannot
        recover your ip address from the hash. we do not use analytics
        cookies or advertising trackers.
      </p>

      <h2>what we do with it</h2>
      <p>
        run the board, count clicks, prevent abuse, and comply with the law.
        nothing else. we do not sell data.
      </p>

      <h2>retention</h2>
      <p>
        listings never expire, so listing data is kept indefinitely. payment
        records are kept as long as required for accounting. click hashes are
        kept for abuse prevention.
      </p>

      <h2>contact</h2>
      <p>
        for privacy requests, use the contact details on the receipt polar
        emailed you after checkout.
      </p>

      <p>
        <Link href="/">back to the board</Link>
      </p>
    </div>
  );
}
