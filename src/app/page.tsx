import BoardApp from "@/components/BoardApp";
import { getActivity, getBoardPage } from "@/lib/board";
import { isCategory } from "@/lib/categories";

export const dynamic = "force-dynamic";

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
      key={`${category ?? "all"}-${board.page}`}
      initial={board}
      initialActivity={activity}
      category={category}
    />
  );
}
