"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ErrorState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { formatDate, statusLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { loadPickups } from "@/lib/supabase/records";
import { useLive } from "@/lib/supabase/use-live";
import { usePrototype } from "@/lib/prototype/session";
import { DonationCertificate } from "@/components/pickups/donation-certificate";
import { cx } from "@/lib/cx";

export function PickupDetail({ id }: { id: string }) {
  const router = useRouter();
  const { profile } = usePrototype();
  const live = useLive(`pickup:${id}`, () => loadPickups(createClient()));
  const pickup = live.data?.find((item) => item.id === id);

  if (live.phase === "loading") return <PageSkeleton cards={2} />;
  if (live.phase === "error") {
    return <ErrorState title="This pickup did not load" text={live.message} onRetry={live.retry} />;
  }
  if (!pickup) {
    return (
      <ErrorState
        title="No pickup matches that link"
        text="That record is not in your account."
        onRetry={() => router.push("/pickups")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-olive">Pickup {pickup.id}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{pickup.deviceName}</h1>
          <p className="mt-2 text-sm text-muted">{pickup.address}, {pickup.city}</p>
        </div>
        <Button href="/pickups" variant="ghost">All pickups</Button>
      </div>
      {pickup.status === "donated" || pickup.status === "completed" ? (
        <DonationCertificate
          donor={profile.name}
          device={pickup.deviceName}
          city={pickup.city}
          date={formatDate(
            pickup.timeline.find((event) => event.status === "donated" && event.at)?.at ??
              pickup.collectionDate ??
              pickup.timeline.find((event) => event.at)?.at ??
              new Date().toISOString(),
          )}
          certificateId={pickup.id}
        />
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-lg font-medium">Collection</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">Date</dt>
              <dd className="text-muted">{pickup.collectionDate ? formatDate(pickup.collectionDate) : "Not booked yet"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Status</dt>
              <dd className="mt-1"><Pill>{statusLabel[pickup.status]}</Pill></dd>
            </div>
            <div>
              <dt className="font-semibold">Description</dt>
              <dd className="mt-1 leading-6 text-muted">
                {pickup.description?.trim() || "No description was saved with this request."}
              </dd>
            </div>
          </dl>
          <h2 className="mt-6 text-lg font-medium">Recycler</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-semibold">{pickup.recycler.name}</dt>
              <dd className="text-muted">{pickup.recycler.contact}</dd>
            </div>
            <div>
              <dt className="font-semibold">Phone</dt>
              <dd className="text-muted">{pickup.recycler.phone}</dd>
            </div>
            <div>
              <dt className="font-semibold">License</dt>
              <dd className="text-muted">{pickup.recycler.license}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-medium">Status timeline</h2>
          <ol className="mt-6 space-y-0">
            {pickup.timeline.map((event, index) => {
              const done = Boolean(event.at);
              return (
                <li key={event.label} className="grid grid-cols-[1.25rem_1fr] gap-4">
                  <div className="flex flex-col items-center">
                    <span className={cx("mt-1 h-3 w-3 rounded-full", done ? "bg-olive" : "bg-line")} />
                    {index < pickup.timeline.length - 1 ? <span className="w-px flex-1 bg-line" /> : null}
                  </div>
                  <div className="pb-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">{event.label}</h3>
                      {done ? <span className="text-xs text-muted">{formatDate(event.at as string)}</span> : <span className="text-xs text-muted">Upcoming</span>}
                    </div>
                    <p className="mt-1 text-sm leading-6 text-muted">{event.note}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
