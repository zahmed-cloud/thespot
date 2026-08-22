import Link from "next/link";

function pageHref(page: number, category: string | null): string {
  const base = category ? `/c/${category}` : "/";
  if (page > 1) return `${base}?page=${page}`;
  return base;
}

/** Server-rendered numbered pagination so page 2 is crawlable. */
export default function Pagination({
  page,
  total,
  perPage,
  category,
}: {
  page: number;
  total: number;
  perPage: number;
  category: string | null;
}) {
  // an empty board needs no bookkeeping under it
  if (total === 0) return null;

  const pages = Math.max(1, Math.ceil(total / perPage));
  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <>
      {pages > 1 && (
        <nav className="pagination" aria-label="pages">
          {page > 1 && (
            <Link href={pageHref(page - 1, category)} aria-label="previous page">
              ←
            </Link>
          )}
          {Array.from({ length: pages }, (_, i) => i + 1).map((n) =>
            n === page ? (
              <span key={n} className="pg current" aria-current="page">
                {n}
              </span>
            ) : (
              <Link key={n} href={pageHref(n, category)}>
                {n}
              </Link>
            )
          )}
          {page < pages && (
            <Link href={pageHref(page + 1, category)} aria-label="next page">
              →
            </Link>
          )}
        </nav>
      )}
      <p className="page-count">
        {from.toLocaleString("en-US")} – {to.toLocaleString("en-US")} of{" "}
        {total.toLocaleString("en-US")}
      </p>
    </>
  );
}
