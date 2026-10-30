import type { Metadata } from "next";
import { MarketplaceView } from "@/components/marketplace/marketplace-view";

export const metadata: Metadata = { title: "Student marketplace" };

export default function Page() {
  return <MarketplaceView />;
}
