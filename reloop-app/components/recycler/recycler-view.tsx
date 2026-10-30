"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TextArea } from "@/components/ui/field";
import { DemoBanner, EmptyState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { formatDate, statusLabel, workingLabel } from "@/lib/format";
import { pickups } from "@/lib/mock/data";
import type { InspectionNote } from "@/lib/prototype/model";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";
import type { PickupRecord, WorkingStatus } from "@/lib/types";

const assigned = pickups.filter((pickup) => pickup.recycler.name === "GreenCircuit Collective");

function InspectionForm({
  pickup,
  saved,
  onSave,
}: {
  pickup: PickupRecord;
  saved?: InspectionNote;
  onSave: (note: InspectionNote) => void;
}) {
  const [notes, setNotes] = useState(saved?.notes ?? "");
  const [working, setWorking] = useState<WorkingStatus>(saved?.working ?? "working");
  const [donationReady, setDonationReady] = useState(saved?.donationReady ?? true);
  const [savedMessage, setSavedMessage] = useState("");

  return (
    <Card>
      <h2 className="text-xl font-medium">Inspection · {pickup.deviceName}</h2>
      <p className="mt-1 text-sm text-muted">Processing status: {statusLabel[pickup.status]}</p>
      {saved ? (
        <p className="mt-3 text-sm text-olive">Last note saved in this browser: {saved.notes || "No written note."}</p>
      ) : null}
      <label className="mt-4 block text-sm font-semibold" htmlFor="notes">Inspection notes</label>
      <TextArea
        id="notes"
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Battery, screen, charger, data wipe"
      />
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold">Working status after inspection</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(workingLabel) as WorkingStatus[]).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={working === item}
              className={working === item ? "rounded-full bg-lime px-3 py-1.5 text-xs font-semibold" : "rounded-full border border-line px-3 py-1.5 text-xs font-semibold"}
              onClick={() => setWorking(item)}
            >
              {workingLabel[item]}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          className="mt-1 accent-olive"
          checked={donationReady}
          onChange={(event) => setDonationReady(event.target.checked)}
        />
        <span>
          <span className="font-semibold">Available for student donation</span>
          <span className="mt-1 block text-muted">Leave this off if the device should go to parts recovery.</span>
        </span>
      </label>
      <Button
        className="mt-5"
        variant="olive"
        onClick={() => {
          onSave({ notes: notes.trim(), donationReady, working });
          setSavedMessage("Saved in this browser. The pickup status in the sample did not change.");
        }}
      >
        Save inspection
      </Button>
      {savedMessage ? <p className="mt-3 text-sm font-semibold text-olive" role="status">{savedMessage}</p> : null}
    </Card>
  );
}

export function RecyclerView() {
  const { ready, inspections, saveInspection } = usePrototype();
  const demo = useDemoResource("recycler");
  const [filter, setFilter] = useState<"open" | "closed">("open");
  const [activeId, setActiveId] = useState(assigned[0]?.id ?? "");

  const visible = assigned.filter((pickup) =>
    filter === "open"
      ? pickup.status !== "donated" && pickup.status !== "completed"
      : pickup.status === "donated" || pickup.status === "completed",
  );
  const active = visible.find((pickup) => pickup.id === activeId) ?? visible[0];

  if (!ready || demo.phase === "loading") return <PageSkeleton cards={2} />;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-olive">Recycler desk</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">GreenCircuit Collective</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Assigned pickups, an inspection note, and whether a device can be offered to a student. Notes stay in this browser.
        </p>
      </div>
      <DemoBanner />
      <div className="flex gap-2" role="group" aria-label="Pickup queue">
        <button type="button" aria-pressed={filter === "open"} className={filter === "open" ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-paper" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"} onClick={() => setFilter("open")}>
          Open
        </button>
        <button type="button" aria-pressed={filter === "closed"} className={filter === "closed" ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-paper" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"} onClick={() => setFilter("closed")}>
          Closed
        </button>
      </div>

      {visible.length === 0 ? (
        <EmptyState title="No pickups in this queue" text="Open still has the MacBook and the headphones. Closed has the donated Latitude." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <ul className="space-y-3">
            {visible.map((pickup) => (
              <li key={pickup.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(pickup.id)}
                  className="w-full rounded-3xl border border-line bg-card p-5 text-left"
                  aria-pressed={active?.id === pickup.id}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone="paper">{statusLabel[pickup.status]}</Pill>
                    <span className="text-xs text-muted">{pickup.collectionDate ? formatDate(pickup.collectionDate) : "No date"}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-medium">{pickup.deviceName}</h2>
                  <p className="text-sm text-muted">{pickup.address}</p>
                </button>
              </li>
            ))}
          </ul>
          {active ? (
            <InspectionForm
              key={active.id}
              pickup={active}
              saved={inspections[active.id]}
              onSave={(note) => saveInspection(active.id, note)}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
