"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DescriptionBox } from "@/components/ui/description-box";
import { TextInput } from "@/components/ui/field";
import { EmptyState, ErrorState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { categoryLabel, formatInr } from "@/lib/format";
import { usePrototype } from "@/lib/prototype/session";
import { createClient } from "@/lib/supabase/client";
import { createAssistance, loadAssistance, loadListings } from "@/lib/supabase/records";
import { useLive } from "@/lib/supabase/use-live";
import type { Category, Condition } from "@/lib/types";

type MatchFit = "suitable" | "repair" | "unsuitable";
type MatchCard = {
  id: string;
  title: string;
  category: Category;
  condition: Condition;
  campus: string;
  fit: MatchFit;
  explanation: string;
};

const deviceWords: Category[] = ["phone", "laptop", "tablet", "monitor", "appliance", "accessory"];

export function MarketplaceView() {
  const { ready, profile } = usePrototype();
  const live = useLive("marketplace", async () => {
    const supabase = createClient();
    const [listings, requests] = await Promise.all([loadListings(supabase), loadAssistance(supabase)]);
    return { listings, requests };
  });
  const [query, setQuery] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [requestError, setRequestError] = useState("");
  const [sent, setSent] = useState(false);
  const [matching, setMatching] = useState(false);
  const [matchNote, setMatchNote] = useState("");
  const [matches, setMatches] = useState<MatchCard[] | null>(null);
  const listings = live.data?.listings;
  const assistanceRequests = live.data?.requests ?? [];

  const devices = useMemo(() => {
    const rows = listings ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((item) =>
      `${item.title} ${item.campus} ${item.category} ${item.donation}`.toLowerCase().includes(needle),
    );
  }, [listings, query]);

  if (!ready || live.phase === "loading") return <PageSkeleton />;
  if (live.phase === "error") return <ErrorState title="The marketplace did not load" text={live.message} onRetry={live.retry} />;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <p className="text-sm font-semibold text-olive">Student marketplace</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Devices ready for a second desk</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Refurbished stock, open assistance requests, and where each donation stands.
          {profile.personalized ? ` Signed in as ${profile.name}.` : " Sign in to request a device."}
        </p>
      </div>

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
            text="No refurbished devices are listed yet, or none match that search."
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
            {assistanceRequests.length === 0 ? <EmptyState title="No requests yet" text="A signed-in student can file one from this page." /> : null}
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
            This is saved as an assistance request on your account. Mention the kind of device you need.
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
                setMatches(null);
                setMatchNote("");
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
              Request saved.
            </p>
          ) : null}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button
              variant="olive"
              onClick={() => {
                const note = requestNote.trim();
                const category = deviceWords.find((word) => note.toLowerCase().includes(word));
                if (note.length < 24 || !category) {
                  setSent(false);
                  setRequestError(category ? "Describe what you need, or use Fill description." : "Name the device: phone, laptop, tablet, monitor, appliance, or accessory.");
                  document.getElementById("need")?.focus();
                  return;
                }
                setRequestError("");
                createAssistance(createClient(), { need: note, campus: profile.city, category })
                  .then(() => {
                    setSent(true);
                    live.retry();
                  })
                  .catch((error: unknown) => {
                    setSent(false);
                    setRequestError(error instanceof Error ? error.message : "The request was not saved.");
                  });
              }}
            >
              Send request
            </Button>
            <Button
              variant="ghost"
              disabled={matching}
              onClick={() => {
                const note = requestNote.trim();
                const category = deviceWords.find((word) => note.toLowerCase().includes(word));
                if (note.length < 12 || !category) {
                  setMatches(null);
                  setMatchNote("");
                  setRequestError(category ? "Describe what you need, or use Fill description." : "Name the device: phone, laptop, tablet, monitor, appliance, or accessory.");
                  document.getElementById("need")?.focus();
                  return;
                }
                setRequestError("");
                setMatching(true);
                fetch("/api/match", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ need: note }),
                })
                  .then(async (response) => {
                    const body = (await response.json()) as { error?: string; message?: string; ai?: string; matches?: MatchCard[] };
                    if (!response.ok) throw new Error(body.error || "The match could not be loaded.");
                    setMatches(body.matches ?? []);
                    setMatchNote(
                      body.ai === "unavailable"
                        ? "The AI provider did not respond. These lines use the listing condition and category."
                        : body.message || "",
                    );
                  })
                  .catch((error: unknown) => {
                    setMatches(null);
                    setMatchNote("");
                    setRequestError(error instanceof Error ? error.message : "The match could not be loaded.");
                  })
                  .finally(() => setMatching(false));
              }}
            >
              {matching ? "Matching" : "Find a match"}
            </Button>
          </div>
          {matchNote ? <p className="mt-3 text-sm text-muted">{matchNote}</p> : null}
          {matches && matches.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No available device is listed for that request.</p>
          ) : null}
          {matches && matches.length > 0 ? (
            <ul className="mt-4 space-y-3">
              {matches.map((item) => (
                <li key={item.id}>
                  <Pill tone={item.fit === "suitable" ? "lime" : item.fit === "repair" ? "paper" : "danger"}>
                    {item.fit === "suitable" ? "Suitable" : item.fit === "repair" ? "Repair candidate" : "Unsuitable"}
                  </Pill>
                  <p className="mt-2 text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{item.explanation}</p>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
