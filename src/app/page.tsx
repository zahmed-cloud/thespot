import type { Metadata } from "next";
import BoardApp from "@/components/BoardApp";
import CategoryBar from "@/components/CategoryBar";
import { getActivity, getBoardPage } from "@/lib/board";
import { categoryLabel, isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

// filtered views are individually indexable: "ai tools on thespot.lol".
// canonicals must be absolute strings — next drops the query string when
// resolving relative urls against metadataBase.
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
  const url = `${SITE}/?category=${params.category}`;
  const title = `${label} on thespot.lol`;
  const description = `the ${label} leaderboard where rank is decided by how much you have paid. $5 gets you on.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "thespot.lol",
      type: "website",
      images: [{ url: `${SITE}/api/og`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@getascent",
      title,
      description,
      images: [`${SITE}/api/og`],
    },
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
