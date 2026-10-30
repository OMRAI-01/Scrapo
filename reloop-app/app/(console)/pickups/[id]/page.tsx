import type { Metadata } from "next";
import { Suspense } from "react";
import { PickupDetail } from "@/components/pickups/pickup-detail";
import { PageSkeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Pickup" };

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <PickupGate params={params} />
    </Suspense>
  );
}

async function PickupGate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PickupDetail id={id} />;
}
