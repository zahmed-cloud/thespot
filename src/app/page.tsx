import type { Metadata } from "next";
import BoardApp from "@/components/BoardApp";
import CategoryBar from "@/components/CategoryBar";
import { getActivity, getBoardPage } from "@/lib/board";
import { categoryLabel, isCategory } from "@/lib/categories";
// (categoryLabel used in generateMetadata)

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

// query-param category urls keep working but canonicalise to the
// path-based /c/<category> pages, which are what actually index
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  if (!params.category || !isCategory(params.category)) {
    return { alternates: { canonical: SITE } };
  }
  const label = categoryLabel(params.category);
  return {
    title: `${label} on thespot.lol`,
    description: `the ${label} leaderboard where rank is decided by how much you have paid. $5 gets you on.`,
    alternates: { canonical: `${SITE}/c/${params.category}` },
  };
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const category =
    params.category && isCategory(params.category) ? params.category : null;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const [board, activity] = await Promise.all([
    getBoardPage(category, page),
    getActivity(),
  ]);

  return (
    <BoardApp
      initial={board}
      initialActivity={activity}
      category={category}
      categoryBar={<CategoryBar active={category} />}
    />
  );
}
