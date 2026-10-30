"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { homeForRole } from "@/lib/prototype/model";
import { usePrototype } from "@/lib/prototype/session";
import type { Role } from "@/lib/types";

const states = [
  { id: "sent", label: "Link sent" },
  { id: "verified", label: "Verified" },
  { id: "expired", label: "Expired" },
] as const;

export type VerifyStatus = (typeof states)[number]["id"];

function isRole(value: string | undefined): value is Role {
  return value === "donor" || value === "student" || value === "recycler" || value === "admin";
}

export function VerifyEmail({
  status,
  name,
  email,
  role,
}: {
  status: VerifyStatus;
  name: string;
  email: string;
  role: string;
}) {
  const router = useRouter();
  const { signIn } = usePrototype();
  const safeRole: Role = isRole(role) ? role : "donor";
  const query = new URLSearchParams({ status, name, email, role: safeRole });

  function finish() {
    signIn({
      name: name || "New member",
      email: email || "member@example.com",
      role: safeRole,
    });
    router.push(homeForRole(safeRole));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Verification states">
        {states.map((item) => {
          const params = new URLSearchParams(query);
          params.set("status", item.id);
          const active = item.id === status;
          return (
            <Link
              key={item.id}
              href={`/verify-email?${params.toString()}`}
              role="tab"
              aria-selected={active}
              className={
                active
                  ? "rounded-full bg-olive px-3 py-1.5 text-xs font-semibold text-paper"
                  : "rounded-full border border-line bg-card px-3 py-1.5 text-xs font-semibold text-ink"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {status === "sent" ? (
        <>
          <h1 className="text-4xl font-medium tracking-tight">Verify your email</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            A live app would email {email || "you"} a link. Here, the message never leaves the browser. Open the other states to see what happens next.
          </p>
          <Button className="mt-8" onClick={() => {
            const params = new URLSearchParams(query);
            params.set("status", "verified");
            router.push(`/verify-email?${params.toString()}`);
          }}>
            Mark this preview as verified
          </Button>
        </>
      ) : null}

      {status === "verified" ? (
        <>
          <h1 className="text-4xl font-medium tracking-tight">Email verified</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            {name || "Your account"} can open the {safeRole} prototype. Points and pickups will still be the shared demo set.
          </p>
          <Button className="mt-8" onClick={finish}>
            Enter Scrapo
          </Button>
        </>
      ) : null}

      {status === "expired" ? (
        <>
          <h1 className="text-4xl font-medium tracking-tight">This link expired</h1>
          <p className="mt-3 text-sm leading-6 text-muted">
            The preview link is older than the window a live email would allow. Send yourself back to the fresh state, or start again.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={() => {
                const params = new URLSearchParams(query);
                params.set("status", "sent");
                router.push(`/verify-email?${params.toString()}`);
              }}
            >
              Show a fresh link
            </Button>
            <Button href="/signup" variant="ghost">
              Start signup again
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
