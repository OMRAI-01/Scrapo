import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { PageSkeleton } from "@/components/ui/feedback";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardGate searchParams={searchParams} />
    </Suspense>
  );
}

async function DashboardGate({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  return <DashboardView forceError={state === "error"} />;
}
