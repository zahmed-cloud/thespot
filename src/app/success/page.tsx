import type { Metadata } from "next";
import SuccessClient from "./SuccessClient";

export const metadata: Metadata = {
  title: "you are on the board — thespot.lol",
  robots: { index: false },
};

export default function Success() {
  return <SuccessClient />;
}
