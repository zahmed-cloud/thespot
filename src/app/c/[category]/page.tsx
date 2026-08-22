import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BoardApp from "@/components/BoardApp";
import CategoryBar from "@/components/CategoryBar";
import { getActivity, getBoardPage } from "@/lib/board";
import { categoryLabel, isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thespot.lol";

// path-based category pages: /c/ai-tools. query urls (/?category=) still
// work but canonicalise here — paths index, query strings mostly do not.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategory(category)) return {};
  const label = categoryLabel(category);
  const url = `${SITE}/c/${category}`;
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

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { category } = await params;
  if (!isCategory(category)) notFound();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);

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
