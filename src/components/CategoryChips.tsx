import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

/** Filter chips. Plain links so a filtered board is shareable. */
export default function CategoryChips({ active }: { active: string | null }) {
  return (
    <nav className="chips column" aria-label="categories">
      <Link href="/" className={`chip${active === null ? " active" : ""}`}>
        all
      </Link>
      {CATEGORIES.map((c) => (
        <Link
          key={c.slug}
          href={`/?category=${c.slug}`}
          className={`chip${active === c.slug ? " active" : ""}`}
        >
          {c.label}
        </Link>
      ))}
    </nav>
  );
}
