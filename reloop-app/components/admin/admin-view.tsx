"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, TextInput } from "@/components/ui/field";
import { DemoBanner, EmptyState, PageSkeleton, Pill } from "@/components/ui/feedback";
import { formatNumber, roleLabel } from "@/lib/format";
import {
  adminUsers,
  donationQueue,
  impactSnapshot,
  leaderboard,
  recyclers,
} from "@/lib/mock/data";
import { usePrototype } from "@/lib/prototype/session";
import { useDemoResource } from "@/lib/prototype/use-demo-resource";

export function AdminView() {
  const demo = useDemoResource("admin");
  const {
    ready,
    admin,
    toggleSuspended,
    setRecyclerStatus,
    setDonationStatus,
    addReward,
    publishWinners,
  } = usePrototype();
  const [userQuery, setUserQuery] = useState("");
  const [rewardName, setRewardName] = useState("Ananya Iyer");
  const [rewardPoints, setRewardPoints] = useState("50");
  const [rewardLabel, setRewardLabel] = useState("Manual adjustment");
  const [rewardError, setRewardError] = useState("");

  const users = useMemo(() => {
    const needle = userQuery.trim().toLowerCase();
    return adminUsers.filter((user) =>
      `${user.name} ${user.email} ${user.role} ${user.city}`.toLowerCase().includes(needle),
    );
  }, [userQuery]);

  const maxCity = Math.max(...impactSnapshot.byCity.map((row) => row.devices));

  if (!ready || demo.phase === "loading") return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-sm font-semibold text-olive">Admin desk</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Keep the loop honest</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Users, recycler checks, donation approval, rewards, the monthly podium, and a sample impact view. Changes stay in this browser.
        </p>
      </div>
      <DemoBanner />

      <section id="users" className="scroll-mt-24 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-medium">User management</h2>
          <label className="w-full sm:max-w-xs">
            <span className="sr-only">Search users</span>
            <TextInput value={userQuery} placeholder="Search name, role, or city" onChange={(event) => setUserQuery(event.target.value)} />
          </label>
        </div>
        {users.length === 0 ? (
          <EmptyState title="No users match" text="Search for Bengaluru, student, or clear the field to see the sample directory." action={<Button variant="ghost" onClick={() => setUserQuery("")}>Clear search</Button>} />
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
        <h2 className="text-2xl font-medium">Recycler verification</h2>
        <ul className="space-y-3">
          {recyclers.map((recycler) => {
            const status = admin.recyclerStatus[recycler.id] ?? recycler.status;
            return (
              <li key={recycler.id}>
                <Card className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{recycler.name}</h3>
                    <p className="text-sm text-muted">{recycler.city} · License {recycler.license}</p>
                    <div className="mt-2"><Pill tone={status === "verified" ? "lime" : status === "pending" ? "paper" : "danger"}>{status.replace("_", " ")}</Pill></div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="olive" onClick={() => setRecyclerStatus(recycler.id, "verified")}>Verify</Button>
                    <Button size="sm" variant="ghost" onClick={() => setRecyclerStatus(recycler.id, "needs_info")}>Ask for info</Button>
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
            const status = admin.donationStatus[item.id] ?? item.status;
            return (
              <li key={item.id}>
                <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-base font-semibold">{item.device}</h3>
                    <p className="text-sm text-muted">{item.student} · {item.campus}</p>
                    <div className="mt-2"><Pill>{status}</Pill></div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setDonationStatus(item.id, "approved")}>Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => setDonationStatus(item.id, "declined")}>Decline</Button>
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
          <p className="mt-2 text-sm text-muted">Adds a row to the rewards history in this browser. It does not change the leaderboard totals.</p>
          <form
            className="mt-4 grid gap-4 sm:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              const points = Number(rewardPoints);
              if (!rewardName.trim() || !rewardLabel.trim() || !Number.isFinite(points) || points === 0) {
                setRewardError("Add a name, a reason, and a non-zero point value.");
                return;
              }
              setRewardError("");
              addReward({
                id: `local-rw-${Date.now()}`,
                label: `${rewardLabel.trim()} · ${rewardName.trim()}`,
                points,
                at: new Date().toISOString().slice(0, 10),
                source: "session",
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
            <Button type="submit" variant="olive">Add to this browser</Button>
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
              <p className="mt-2 text-sm text-muted">October 2026 sample. Publishing only flags the board in this browser.</p>
            </div>
            <Button variant="olive" onClick={publishWinners} disabled={admin.winnersPublished}>
              {admin.winnersPublished ? "Published in this browser" : "Publish winners"}
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
        <p className="mt-2 text-sm text-muted">Illustrative totals for a prototype month. Not measured traffic.</p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Devices", impactSnapshot.devicesThisMonth],
            ["Kg diverted", impactSnapshot.kilogramsDiverted],
            ["Students matched", impactSnapshot.studentsMatched],
            ["Points issued", impactSnapshot.pointsIssued],
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
            {impactSnapshot.byCity.map((row) => (
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
