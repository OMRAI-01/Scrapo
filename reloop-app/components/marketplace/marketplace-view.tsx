"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DescriptionBox } from "@/components/ui/description-box";
import { TextInput } from "@/components/ui/field";
import { DemoBanner, EmptyState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { categoryLabel, formatInr } from "@/lib/format";
import { assistanceRequests, listings } from "@/lib/mock/data";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";

export function MarketplaceView() {
  const { ready, profile } = usePrototype();
  const demo = useDemoResource("marketplace");
  const [query, setQuery] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState("");
  const [sent, setSent] = useState(false);

  const devices = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((item) =>
      `${item.title} ${item.campus} ${item.category} ${item.donation}`.toLowerCase().includes(needle),
    );
  }, [query]);

  if (!ready || demo.phase === "loading") return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-olive">Student marketplace</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Devices ready for a second desk</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Refurbished stock, open assistance requests, and where each donation stands.
          {profile.role === "student" ? " You are previewing this as a student." : " Switch the demo role to Student if you want that label on the session."}
        </p>
      </div>
      <DemoBanner />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-xl font-medium">Available refurbished devices</h2>
          <label className="block w-full sm:max-w-xs">
            <span className="sr-only">Search devices</span>
            <TextInput
              value={query}
              placeholder="Search title, campus, or status"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        {devices.length === 0 ? (
          <EmptyState
            title="No devices match that search"
            text="Try a campus, a category such as laptop, or clear the search to see the sample stock."
            action={<Button variant="ghost" onClick={() => setQuery("")}>Clear search</Button>}
          />
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {devices.map((item) => (
              <li key={item.id}>
                <Card className="h-full">
                  <div className="flex items-center justify-between gap-2">
                    <Pill tone={item.donation === "donated" ? "olive" : item.donation === "reserved" ? "paper" : "lime"}>
                      {item.donation}
                    </Pill>
                    <span className="text-xs font-semibold text-muted">{categoryLabel[item.category]}</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-medium">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted">{item.note}</p>
                  <p className="mt-4 font-display text-2xl text-olive">
                    {item.studentPrice === null ? "Donation" : formatInr(item.studentPrice)}
                  </p>
                  <p className="mt-1 text-xs text-muted">{item.campus}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <h2 className="text-xl font-medium">Student assistance requests</h2>
          <ul className="mt-4 space-y-3">
            {assistanceRequests.map((request) => (
              <li key={request.id}>
                <Card>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={request.status === "open" ? "lime" : "paper"}>{request.status}</Pill>
                    <span className="text-xs text-muted">{categoryLabel[request.category]}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{request.need}</h3>
                  <p className="text-sm text-muted">{request.student} · {request.campus}</p>
                  <p className="mt-2 text-sm leading-6 text-muted">{request.note}</p>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <Card>
          <h2 className="text-xl font-medium">Ask for a device</h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This note stays on the page. It is not filed as a real assistance request.
          </p>
          <div className="mt-4">
            <DescriptionBox
              id="need"
              label="What do you need it for?"
              hint="Say which course or project it is for, and whether a donated device is enough."
              placeholder="I need a laptop for lab work this semester. A refurbished one is fine if it can run a browser and documents."
              value={requestNote}
              error={requestError}
              onChange={(value) => {
                setRequestNote(value);
                setSent(false);
                setRequestError("");
              }}
              onFill={() => {
                setRequestNote(
                  "I need a working laptop for classes this semester. A refurbished one is fine if it can run a browser, documents, and video calls. I can collect it from campus and I do not need the newest model.",
                );
                setRequestError("");
                setSent(false);
              }}
            />
          </div>
          {sent ? (
            <p className="mt-3 text-sm font-semibold text-olive" role="status">
              Saved in this view only. Refreshing clears it.
            </p>
          ) : null}
          <Button
            className="mt-4"
            variant="olive"
            onClick={() => {
              if (requestNote.trim().length < 24) {
                setSent(false);
                setRequestError("Describe what you need, or use Fill description.");
                document.getElementById("need")?.focus();
                return;
              }
              setRequestError("");
              setSent(true);
            }}
          >
            Keep this note here
          </Button>
        </Card>
      </section>
    </div>
  );
}
