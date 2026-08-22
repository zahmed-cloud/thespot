import BoardApp from "@/components/BoardApp";
import { getBoard } from "@/lib/board";

export const dynamic = "force-dynamic";

export default async function Home() {
  const board = await getBoard();
  return <BoardApp initialBoard={board} />;
}
