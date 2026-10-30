import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyEmail, type VerifyStatus } from "@/components/auth/verify-email";

export const metadata: Metadata = { title: "Verify email" };

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading verification state</p>}>
      <VerifyGate searchParams={searchParams} />
    </Suspense>
  );
}

async function VerifyGate({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = one(params.status);
  const status: VerifyStatus = raw === "verified" || raw === "expired" ? raw : "sent";
  return (
    <VerifyEmail
      status={status}
      name={one(params.name) ?? ""}
      email={one(params.email) ?? ""}
      role={one(params.role) ?? "donor"}
    />
  );
}
