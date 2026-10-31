import {
  createSimpleAccount,
  loginSimpleAccount,
  resetSimpleAccountPassword,
} from "@/lib/auth/account-service";
import type { Role } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      password?: unknown;
      role?: unknown;
      city?: unknown;
    };

    const name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";
    const role = typeof body.role === "string" ? (body.role as Role) : "donor";
    const city = typeof body.city === "string" ? body.city : "Bengaluru";

    const res = await createSimpleAccount({ name, password, role, city });
    if (!res.success) {
      return Response.json({ error: res.error }, { status: 400 });
    }

    return Response.json({ success: true, user: res.user });
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
      name?: unknown;
      password?: unknown;
    };

    const name = typeof body.name === "string" ? body.name : "";
    const password = typeof body.password === "string" ? body.password : "";

    const res = await loginSimpleAccount({ name, password });
    if (!res.success) {
      return Response.json({ error: res.error }, { status: 400 });
    }

    return Response.json({ success: true, user: res.user });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: unknown;
      newPassword?: unknown;
    };

    const name = typeof body.name === "string" ? body.name : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    const res = await resetSimpleAccountPassword({ name, newPassword });
    if (!res.success) {
      return Response.json({ error: res.error }, { status: 400 });
    }

    return Response.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 },
    );
  }
}

