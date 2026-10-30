import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingView } from "@/components/devices/listing-view";
import { PageSkeleton } from "@/components/ui/feedback";
import { isCategory } from "@/lib/format";

export const metadata: Metadata = { title: "List a device" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton cards={2} />}>
      <ListingGate searchParams={searchParams} />
    </Suspense>
  );
}

async function ListingGate({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  return <ListingView initialCategory={isCategory(category) ? category : undefined} />;
}
