"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBanner, EmptyState, ErrorState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { formatDate, formatInr, formatNumber } from "@/lib/format";
import { activity, dashboardSummary } from "@/lib/mock/data";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";
import type { ActivityItem } from "@/lib/types";

const filters: Array<{ id: "all" | ActivityItem["kind"] | "archive"; label: string }> = [
  { id: "all", label: "All" },
  { id: "pickup", label: "Pickups" },
  { id: "reward", label: "Rewards" },
  { id: "donation", label: "Donations" },
  { id: "archive", label: "Archive" },
];

export function DashboardView({ forceError = false }: { forceError?: boolean }) {
  const { profile, ready } = usePrototype();
  const demo = useDemoResource("dashboard", forceError);
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const items = useMemo(() => {
    if (filter === "archive") return [];
    if (filter === "all") return activity;
    return activity.filter((item) => item.kind === filter);
  }, [filter]);

  if (!ready || demo.phase === "loading") return <PageSkeleton />;
  if (demo.phase === "error") {
    return (
      <ErrorState
        title="The dashboard sample did not load"
        text="Retry to show the demo profile. This does not contact Scrapo."
        onRetry={demo.retry}
      />
    );
  }

  const stats = [
    { label: "Donated devices", value: String(dashboardSummary.donatedCount), hint: "Sample history for this profile" },
    { label: "Estimated value", value: formatInr(dashboardSummary.estimatedValue), hint: "Sum of the donated sample devices" },
    { label: "Reward points", value: formatNumber(profile.pointsMonth), hint: "This month, still a sample" },
    { label: "Leaderboard", value: `#${profile.rank}`, hint: "October 2026 sample board" },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-olive">
            {profile.personalized ? "Prototype session" : "Sample profile"}
          </p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
            Hello, {profile.name.split(" ")[0]}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
            {profile.role === "student"
              ? "Your student tools live in the marketplace. The numbers here still belong to the shared demo donor history."
              : "Track what you have handed over, what it was worth, and where you sit on the monthly board."}
          </p>
        </div>
        <Button href="/devices/new">List a device</Button>
      </div>

      <DemoBanner>
        {profile.personalized
          ? `You are signed in on this device as ${profile.name}. The counts below are still the Ananya Iyer sample, not a personal history.`
          : "Showing the Ananya Iyer sample. Switch role in the header, or log in to put your name on it."}{" "}
        <Link href="/dashboard?state=error" className="font-semibold text-lime underline">
          Preview the error state
        </Link>
      </DemoBanner>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Summary">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <p className="text-sm font-semibold text-muted">{stat.label}</p>
            <p className="mt-2 font-display text-3xl font-medium text-ink">{stat.value}</p>
            <p className="mt-2 text-xs leading-5 text-muted">{stat.hint}</p>
          </Card>
        ))}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium">Recent activity</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter activity">
            {filters.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={filter === item.id}
                className={
                  filter === item.id
                    ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-paper"
                    : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"
                }
                onClick={() => setFilter(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="Nothing in the archive"
            text="The sample profile has no archived activity. The other filters still have pickups, rewards, and donations."
            action={
              <Button variant="ghost" onClick={() => setFilter("all")}>
                Show all activity
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Pill tone="paper">{item.kind}</Pill>
                      <span className="text-xs text-muted">{formatDate(item.at)}</span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-ink">{item.title}</h3>
                    <p className="text-sm text-muted">{item.detail}</p>
                  </div>
                  {item.kind === "pickup" ? (
                    <Button
                      href={item.id === "ac-3" ? "/pickups/pk-2033" : "/pickups/pk-2041"}
                      variant="ghost"
                      size="sm"
                    >
                      Track pickup
                    </Button>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
