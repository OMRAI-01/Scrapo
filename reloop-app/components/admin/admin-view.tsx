"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { EmptyState, ErrorState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { formatDate, formatNumber, roleLabel } from "@/lib/format";
import { usePrototype } from "@/lib/prototype/session";
import { createClient } from "@/lib/supabase/client";
import { finalizeMonthlyWinners, loadAdmin, updateListingStatus, updateRecyclerStatus, verifySanitisationRecord } from "@/lib/supabase/records";
import { useLive } from "@/lib/supabase/use-live";
import { initialSanitisationRecords, pickups } from "@/lib/mock/data";
import { AdminTrackerOverview } from "@/components/tracker/admin-tracker-overview";

export function AdminView() {
  const live = useLive("admin", () => loadAdmin(createClient()));
  const { admin, toggleSuspended, profile, setRecyclerStatus, sanitisations, verifySanitisation } = usePrototype();
  const [userQuery, setUserQuery] = useState("");
  const [recyclerFilter, setRecyclerFilter] = useState<"all" | "pending" | "verified">("all");
  const [rewardName, setRewardName] = useState("");
  const [rewardPoints, setRewardPoints] = useState("50");
  const [rewardLabel, setRewardLabel] = useState("Manual adjustment");
  const [rewardError, setRewardError] = useState("");
  const [actionError, setActionError] = useState("");
  const [auditMessage, setAuditMessage] = useState("");
  const directory = live.data?.users;
  const recyclers = useMemo(() => live.data?.recyclers ?? [], [live.data?.recyclers]);
  const donationQueue = live.data?.donations ?? [];
  const leaderboard = live.data?.board ?? [];
  const impact = live.data?.impact ?? { devices: 0, students: 0, points: 0, byCity: [] as { city: string; devices: number }[] };

  const users = useMemo(() => {
    const needle = userQuery.trim().toLowerCase();
    return (directory ?? []).filter((user) =>
      `${user.name} ${user.role} ${user.city}`.toLowerCase().includes(needle),
    );
  }, [directory, userQuery]);

  const filteredRecyclers = useMemo(() => {
    return recyclers.filter((recycler) => {
      const status = admin.recyclerStatus[recycler.id] ?? recycler.status;
      if (recyclerFilter === "verified") return status === "verified";
      if (recyclerFilter === "pending") return status === "pending" || status === "needs_info";
      return true;
    });
  }, [admin.recyclerStatus, recyclerFilter, recyclers]);

  const allSanitisations = useMemo(() => {
    return Object.values({ ...initialSanitisationRecords, ...sanitisations });
  }, [sanitisations]);

  const maxCity = Math.max(1, ...impact.byCity.map((row) => row.devices));

  if (live.phase === "loading") return <PageSkeleton />;
  if (live.phase === "error") return <ErrorState title="The admin desk did not load" text={live.message} onRetry={live.retry} />;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-sm font-semibold text-olive">Admin desk</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Keep the loop honest</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Users, recycler checks, listings, and points from the database.
          {actionError ? ` ${actionError}` : ""}
        </p>
      </div>

      {/* Scrapo AI Tracker: Admin Operations & Delay Monitoring */}
      <AdminTrackerOverview pickups={pickups} />

      <section id="users" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-medium">User management</h2>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Search users</span>
            <TextInput value={userQuery} placeholder="Search name, role, or city" onChange={(event) => setUserQuery(event.target.value)} />
          </label>
        </div>
        {users.length === 0 ? (
          <EmptyState title="No users match" text="No profiles are stored yet, or none match that search." action={<Button variant="ghost" onClick={() => setUserQuery("")}>Clear search</Button>} />
        ) : (
          <ul className="space-y-3">
            {users.map((user) => {
              const suspended = admin.suspendedUserIds.includes(user.id);
              return (
                <li key={user.id}>
                  <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{user.name}</h3>
                        <Pill tone="paper">{roleLabel[user.role]}</Pill>
                        {suspended ? <Pill tone="danger">Suspended in this browser</Pill> : null}
                      </div>
                      <p className="text-sm text-muted">{user.email} · {user.city} · {formatNumber(user.points)} lifetime pts</p>
                    </div>
                    <Button variant={suspended ? "lime" : "ghost"} size="sm" onClick={() => toggleSuspended(user.id)}>
                      {suspended ? "Restore" : "Suspend"}
                    </Button>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section id="recyclers" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-medium">Recycler verification</h2>
            <p className="text-xs text-muted">
              Only authorised administrators can review compliance and grant verified partner status.
            </p>
          </div>
          <div className="flex gap-2" role="group" aria-label="Filter recyclers">
            <button
              type="button"
              className={recyclerFilter === "all" ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-on-accent" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"}
              onClick={() => setRecyclerFilter("all")}
            >
              All ({recyclers.length})
            </button>
            <button
              type="button"
              className={recyclerFilter === "pending" ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-on-accent" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"}
              onClick={() => setRecyclerFilter("pending")}
            >
              Pending / Info
            </button>
            <button
              type="button"
              className={recyclerFilter === "verified" ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-on-accent" : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold"}
              onClick={() => setRecyclerFilter("verified")}
            >
              Verified
            </button>
          </div>
        </div>

        {filteredRecyclers.length === 0 ? (
          <EmptyState title="No recyclers in this filter" text="Try selecting a different filter option." />
        ) : (
          <ul className="space-y-3">
            {filteredRecyclers.map((recycler) => {
              const status = admin.recyclerStatus[recycler.id] ?? recycler.status;
              const isVerified = status === "verified";
              return (
                <li key={recycler.id}>
                  <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{recycler.name}</h3>
                        <Pill tone={isVerified ? "lime" : status === "pending" ? "paper" : "danger"}>
                          {isVerified ? "✓ Verified Partner" : status.replace("_", " ")}
                        </Pill>
                      </div>
                      <p className="mt-1 text-sm text-muted">{recycler.city} · License {recycler.license}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="olive"
                        onClick={() => {
                          if (profile.role !== "admin") {
                            setActionError("Only administrators can mark recyclers verified.");
                            return;
                          }
                          try {
                            setRecyclerStatus(recycler.id, "verified");
                            updateRecyclerStatus(createClient(), recycler.id, "verified")
                              .then(() => live.retry())
                              .catch(() => {});
                          } catch (err) {
                            setActionError(err instanceof Error ? err.message : "Error verifying recycler.");
                          }
                        }}
                      >
                        Verify Partner
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (profile.role !== "admin") {
                            setActionError("Only administrators can change recycler status.");
                            return;
                          }
                          try {
                            setRecyclerStatus(recycler.id, "needs_info");
                            updateRecyclerStatus(createClient(), recycler.id, "needs_info")
                              .then(() => live.retry())
                              .catch(() => {});
                          } catch (err) {
                            setActionError(err instanceof Error ? err.message : "Error updating recycler.");
                          }
                        }}
                      >
                        Ask for info
                      </Button>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Scrapo TrustShield: Data Sanitisation Verification Queue */}
      <section id="trustshield" className="scroll-mt-24 space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-medium">TrustShield Sanitisation Audit</h2>
            <Pill tone="paper">Admin Review Desk</Pill>
          </div>
          <p className="mt-1 text-xs text-muted">
            Strict verification queue: Inspect erasure logs and cryptographic evidence before issuing TrustShield certificates. Never claim successful erasure without verified evidence.
          </p>
        </div>

        {auditMessage && <p className="text-xs font-semibold text-olive">{auditMessage}</p>}

        <ul className="space-y-3">
          {allSanitisations.map((san) => {
            const isVerified = san.verificationStatus === "verified";
            const isCompleted = san.status === "completed";
            const isFailed = san.status === "failed";
            return (
              <li key={san.id}>
                <Card className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold">Device {san.deviceId}</h3>
                      <Pill tone={isCompleted ? "lime" : isFailed ? "danger" : "paper"}>
                        Sanitisation: {san.status.replace("_", " ")}
                      </Pill>
                      <Pill tone={isVerified ? "lime" : "paper"}>
                        Verification: {san.verificationStatus.replace("_", " ")}
                      </Pill>
                    </div>
                    <p className="text-xs text-muted">
                      Method: <strong className="text-ink">{san.method}</strong> · Recycler: <strong>{san.responsibleRecycler}</strong> ({san.technicianName})
                    </p>
                    <p className="text-xs font-mono text-muted">
                      Evidence Ref: {san.verificationEvidence ? (
                        <span className="text-ink font-semibold">{san.verificationEvidence}</span>
                      ) : (
                        <span className="italic text-danger">No evidence submitted</span>
                      )}
                    </p>
                    {san.completedAt && (
                      <p className="text-[11px] text-muted">
                        Completed at: {formatDate(san.completedAt)}
                        {san.verifiedBy ? ` · Verified by: ${san.verifiedBy}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {san.verificationStatus !== "verified" ? (
                      <Button
                        size="sm"
                        variant="olive"
                        onClick={async () => {
                          if (profile.role !== "admin") {
                            setActionError("Only administrators can approve sanitisation records.");
                            return;
                          }
                          if (!san.verificationEvidence?.trim()) {
                            setActionError("Cannot verify without evidence reference.");
                            return;
                          }
                          try {
                            verifySanitisation(san.pickupId, "verified");
                            await verifySanitisationRecord(createClient(), san.id, "verified").catch(() => {});
                            setAuditMessage(`TrustShield: Device ${san.deviceId} sanitisation verified.`);
                          } catch (err) {
                            setActionError(err instanceof Error ? err.message : "Verification failed.");
                          }
                        }}
                      >
                        Approve Evidence
                      </Button>
                    ) : (
                      <span className="text-xs text-olive font-semibold flex items-center gap-1">
                        ✓ Certificate Active
                      </span>
                    )}

                    {san.verificationStatus !== "rejected" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (profile.role !== "admin") {
                            setActionError("Only administrators can reject sanitisation records.");
                            return;
                          }
                          try {
                            verifySanitisation(san.pickupId, "rejected");
                            await verifySanitisationRecord(createClient(), san.id, "rejected").catch(() => {});
                            setAuditMessage(`TrustShield: Device ${san.deviceId} evidence rejected.`);
                          } catch (err) {
                            setActionError(err instanceof Error ? err.message : "Rejection failed.");
                          }
                        }}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="donations" className="scroll-mt-24 space-y-4">
        <h2 className="text-2xl font-medium">Donation approval</h2>
        <ul className="space-y-3">
          {donationQueue.map((item) => {
            const status = item.status;
            return (
              <li key={item.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{item.device}</h3>
                    <p className="text-sm text-muted">{item.student} · {item.campus}</p>
                    <div className="mt-2"><Pill>{status}</Pill></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { updateListingStatus(createClient(), item.id, "donated").then(() => live.retry()).catch((error: unknown) => setActionError(error instanceof Error ? error.message : "Could not update the listing.")); }}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => { updateListingStatus(createClient(), item.id, "available").then(() => live.retry()).catch((error: unknown) => setActionError(error instanceof Error ? error.message : "Could not update the listing.")); }}>Decline</Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>

      <section id="reward-desk" className="scroll-mt-24">
        <Card>
          <h2 className="text-2xl font-medium">Reward management</h2>
          <p className="mt-2 text-sm text-muted">Writes a reward event for a member already in the directory. Points on the profile are not edited from here.</p>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              const points = Number(rewardPoints);
              const member = (directory ?? []).find((user) => user.name.toLowerCase() === rewardName.trim().toLowerCase());
              if (!member || !rewardLabel.trim() || !Number.isFinite(points) || points === 0) {
                setRewardError("Use a member name from the directory, a reason, and a non-zero point value.");
                return;
              }
              setRewardError("");
              createClient()
                .from("reward_events")
                .insert({ profile_id: member.id, label: rewardLabel.trim(), points })
                .then(({ error }) => {
                  if (error) setRewardError(error.message);
                  else live.retry();
                });
            }}
          >
            <Field label="Member" htmlFor="reward-name">
              <TextInput id="reward-name" value={rewardName} onChange={(event) => setRewardName(event.target.value)} />
            </Field>
            <Field label="Reason" htmlFor="reward-label">
              <TextInput id="reward-label" value={rewardLabel} onChange={(event) => setRewardLabel(event.target.value)} />
            </Field>
            <Field label="Points" htmlFor="reward-points" error={rewardError}>
              <TextInput id="reward-points" inputMode="numeric" value={rewardPoints} onChange={(event) => setRewardPoints(event.target.value)} />
            </Field>
            <Button type="submit" variant="olive">Add reward</Button>
          </form>
          {admin.extraRewards.length ? (
            <ul className="mt-4 space-y-2 text-sm">
              {admin.extraRewards.map((event) => (
                <li key={event.id} className="flex justify-between gap-3 rounded-2xl bg-paper px-3 py-2">
                  <span>{event.label}</span>
                  <span className="font-semibold">{event.points > 0 ? "+" : ""}{event.points}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </section>

      <section id="winners" className="scroll-mt-24">
        <Card>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-medium">Monthly winners</h2>
              <p className="mt-2 text-sm text-muted">Top of the live monthly board.</p>
            </div>
            <Button variant="olive" onClick={() => { setActionError(""); finalizeMonthlyWinners(createClient()).then(() => live.retry()).catch((error: unknown) => setActionError(error instanceof Error ? error.message : "Winners were not published.")); }} disabled={admin.winnersPublished}>
              Publish winners
            </Button>
          </div>
          <ol className="mt-4 grid gap-3 md:grid-cols-3">
            {leaderboard.slice(0, 3).map((entry) => (
              <li key={entry.rank} className="rounded-3xl bg-paper p-4">
                <p className="text-sm font-semibold text-olive">#{entry.rank}</p>
                <p className="mt-1 text-lg font-semibold">{entry.name}</p>
                <p className="text-sm text-muted">{formatNumber(entry.points)} pts</p>
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <section id="impact" className="scroll-mt-24">
        <h2 className="text-2xl font-medium">Impact analytics</h2>
        <p className="mt-2 text-sm text-muted">Counted from pickups, matched requests, and reward events.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Pickups", impact.devices],
            ["Students matched", impact.students],
            ["Points issued", impact.points],
          ].map(([label, value]) => (
            <Card key={String(label)}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="mt-2 font-display text-3xl">{formatNumber(Number(value))}</dd>
            </Card>
          ))}
        </dl>
        <Card className="mt-4">
          <h3 className="text-lg font-medium">Devices by city</h3>
          <ul className="mt-4 space-y-3">
            {impact.byCity.map((row) => (
              <li key={row.city}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-semibold">{row.city}</span>
                  <span>{row.devices}</span>
                </div>
                <div className="h-2 rounded-full bg-paper">
                  <div className="h-full rounded-full bg-olive" style={{ width: `${Math.round((row.devices / maxCity) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}
