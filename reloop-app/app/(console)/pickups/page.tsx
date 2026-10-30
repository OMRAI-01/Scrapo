import type { Metadata } from "next";
import { PickupsView } from "@/components/pickups/pickups-view";

export const metadata: Metadata = { title: "Pickups" };

export default function Page() {
  return <PickupsView />;
}
