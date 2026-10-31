import {
  requestPhoneOtp,
  verifyPhoneOtp,
  findUserByPhone,
  normalizePhoneNumber,
  saveUserProfile,
} from "@/lib/auth/phone-service";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: unknown };
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!phone) {
      return Response.json({ error: "Phone number is required." }, { status: 400 });
    }

    const res = requestPhoneOtp(phone);
    if (!res.success) {
      return Response.json(
        { error: res.error, cooldownRemaining: res.cooldownRemaining },
        { status: 400 },
      );
    }

    const existingUser = await findUserByPhone(phone);

    return Response.json({
      success: true,
      phoneNumber: res.phoneNumber,
      originBoundSms: res.originBoundSms,
      isExistingUser: Boolean(existingUser),
      user: existingUser,
      // Pass code in response for testing/local development
      code: res.code,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: unknown;
      code?: unknown;
      name?: unknown;
      role?: unknown;
      city?: unknown;
    };
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const role = typeof body.role === "string" ? (body.role.trim() as Role) : "donor";
    const city = typeof body.city === "string" ? body.city.trim() : "Bengaluru";

    if (!phone || !code) {
      return Response.json({ error: "Phone number and 6-digit code are required." }, { status: 400 });
    }

    const res = verifyPhoneOtp(phone, code);
    if (!res.valid) {
      return Response.json({ error: res.error || "Invalid verification code." }, { status: 400 });
    }

    const norm = normalizePhoneNumber(phone);
    let user = await findUserByPhone(phone);

    // If new user and name provided, persist real profile
    if (!user && name) {
      user = await saveUserProfile({
        name,
        phone: norm,
        role,
        city,
      });
    }

    return Response.json({
      success: true,
      valid: true,
      phoneNumber: norm,
      user,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}
