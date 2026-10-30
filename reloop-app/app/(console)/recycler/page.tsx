import type { Metadata } from "next";
import { RecyclerView } from "@/components/recycler/recycler-view";

export const metadata: Metadata = { title: "Recycler desk" };

export default function Page() {
  return <RecyclerView />;
}
