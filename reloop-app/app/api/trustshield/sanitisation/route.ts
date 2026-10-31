import { createClient } from "@/lib/supabase/server";
import type { SanitisationStatus, SanitisationVerificationStatus } from "@/lib/types";

const ALLOWED_STATUSES: SanitisationStatus[] = ["pending", "in_progress", "completed", "failed"];
const ALLOWED_VERIFICATIONS: SanitisationVerificationStatus[] = ["pending_review", "verified", "rejected"];

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return Response.json({ error: "Authentication required to submit sanitisation records." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", auth.user.id)
      .maybeSingle();

    if (profile?.role !== "recycler" && profile?.role !== "admin") {
      return Response.json(
        { error: "Access denied. Only authorised recyclers or administrators can record device sanitisation." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      deviceId?: unknown;
      pickupId?: unknown;
      status?: unknown;
      method?: unknown;
      verificationEvidence?: unknown;
      notes?: unknown;
    };

    const deviceId = typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    const pickupId = typeof body.pickupId === "string" ? body.pickupId.trim() : "";
    const status = body.status as SanitisationStatus;
    const method = typeof body.method === "string" ? body.method.trim() : "";
    const verificationEvidence = typeof body.verificationEvidence === "string" ? body.verificationEvidence.trim() : "";
    const notes = typeof body.notes === "string" ? body.notes.trim() : "";

    if (!deviceId || !pickupId) {
      return Response.json({ error: "Missing required deviceId or pickupId." }, { status: 400 });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return Response.json(
        { error: "Invalid status. Must be pending, in_progress, completed, or failed." },
        { status: 400 },
      );
    }

    if (!method) {
      return Response.json({ error: "A sanitisation method is required." }, { status: 400 });
    }

    // Critical Scrapo TrustShield rule: Never claim successful erasure without evidence!
    if (status === "completed" && !verificationEvidence) {
      return Response.json(
        { error: "Verification evidence reference (e.g. erasure log ID, certificate hash) is strictly required to mark sanitisation completed." },
        { status: 400 },
      );
    }

    const { data: member } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("profile_id", auth.user.id)
      .maybeSingle();

    const { data, error } = await supabase
      .from("device_sanitisation_records")
      .insert({
        device_id: deviceId,
        pickup_id: pickupId,
        status,
        method,
        technician_id: auth.user.id,
        organization_id: member?.organization_id ?? null,
        completed_at: status === "completed" ? new Date().toISOString() : null,
        verification_evidence: verificationEvidence,
        verification_status: "pending_review",
        notes,
      })
      .select("id")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Append to custody history
    await supabase.from("device_custody_history").insert({
      device_id: deviceId,
      pickup_id: pickupId,
      stage: "sanitisation",
      action: `Sanitisation recorded: ${status} via ${method}`,
      responsible_user_id: auth.user.id,
      responsible_role: profile.role,
      notes: notes || `Evidence: ${verificationEvidence || "None"}`,
    });

    return Response.json({
      success: true,
      id: data.id,
      message: "Sanitisation record submitted for review.",
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return Response.json({ error: "Authentication required to verify sanitisation records." }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();

    // Only authorised verification roles (admin) can approve the records.
    if (profile?.role !== "admin") {
      return Response.json(
        { error: "Access denied. Only authorised administrators can verify or approve sanitisation records." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as {
      recordId?: unknown;
      verificationStatus?: unknown;
    };

    const recordId = typeof body.recordId === "string" ? body.recordId.trim() : "";
    const verificationStatus = body.verificationStatus as SanitisationVerificationStatus;

    if (!recordId || !ALLOWED_VERIFICATIONS.includes(verificationStatus)) {
      return Response.json({ error: "Invalid recordId or verificationStatus." }, { status: 400 });
    }

    const { data: record, error: fetchError } = await supabase
      .from("device_sanitisation_records")
      .select("id, pickup_id, device_id")
      .eq("id", recordId)
      .single();

    if (fetchError || !record) {
      return Response.json({ error: "Sanitisation record not found." }, { status: 404 });
    }

    const { error: updateError } = await supabase
      .from("device_sanitisation_records")
      .update({
        verification_status: verificationStatus,
        verified_by: auth.user.id,
        verified_at: new Date().toISOString(),
      })
      .eq("id", recordId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // Append audit custody event
    await supabase.from("device_custody_history").insert({
      device_id: record.device_id,
      pickup_id: record.pickup_id,
      stage: "sanitisation",
      action: `Sanitisation record marked ${verificationStatus} by administrator`,
      responsible_user_id: auth.user.id,
      responsible_role: "admin",
      responsible_org: "Scrapo TrustShield Verification",
      notes: `Verification status updated to ${verificationStatus}.`,
    });

    return Response.json({
      success: true,
      message: `Sanitisation record successfully marked as ${verificationStatus}.`,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal server error." },
      { status: 500 },
    );
  }
}

