"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoBanner, EmptyState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { categoryLabel, formatDate, statusLabel } from "@/lib/format";
import { pickups as samplePickups } from "@/lib/mock/data";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";
import { useMemo, useState } from "react";
import type { PickupStatus } from "@/lib/types";

const filters: Array<PickupStatus | "all" | "unassigned"> = [
  "all",
  "requested",
  "scheduled",
  "processing",
  "donated",
  "unassigned",
];

export function PickupsView() {
  const { ready, drafts } = usePrototype();
  const demo = useDemoResource("pickups");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const all = useMemo(() => [...drafts, ...samplePickups], [drafts]);
  const visible = all.filter((pickup) => {
    if (filter === "all") return true;
    if (filter === "unassigned") return pickup.recycler.name === "Awaiting assignment";
    return pickup.status === filter;
  });

  if (!ready || demo.phase === "loading") return <PageSkeleton cards={3} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-olive">Pickup tracking</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Collections</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
          Follow a request from the booking to the student handoff. Listings you create here are marked as session drafts.
        </p>
      </div>
      <DemoBanner />
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter pickups">
        {filters.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={filter === item}
            className={filter === item ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-paper" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"}
            onClick={() => setFilter(item)}
          >
            {item === "all" ? "All" : item === "unassigned" ? "Unassigned" : statusLabel[item]}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <EmptyState
          title="No pickups in this filter"
          text="The sample set has scheduled, processing, and donated collections. Unassigned appears after you request a pickup from a listing."
          action={<Button variant="ghost" href="/devices/new">List a device</Button>}
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((pickup) => (
            <li key={pickup.id}>
              <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={pickup.source === "session" ? "olive" : "lime"}>
                      {pickup.source === "session" ? "This browser" : "Demo sample"}
                    </Pill>
                    <Pill tone="paper">{statusLabel[pickup.status]}</Pill>
                  </div>
                  <h2 className="mt-3 text-xl font-medium">{pickup.deviceName}</h2>
                  <p className="text-sm text-muted">
                    {categoryLabel[pickup.category]} · {pickup.city}
                    {pickup.collectionDate ? ` · ${formatDate(pickup.collectionDate)}` : " · date not set"}
                  </p>
                  <p className="mt-1 text-sm text-muted">{pickup.recycler.name}</p>
                </div>
                <Button href={`/pickups/${pickup.id}`} variant="olive">
                  Open timeline
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
