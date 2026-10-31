"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { homeForRole } from "@/lib/prototype/model";
import { usePrototype } from "@/lib/prototype/session";
import type { Role } from "@/lib/types";

export function LoginForm() {
  const router = useRouter();
  const { signIn } = usePrototype();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; password?: string; general?: string }>({});
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Please enter your account name.";
    if (!password.trim()) nextErrors.password = "Please enter your password.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password: password.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success || !data.user) {
        setErrors({ general: data.error || "Invalid name or password." });
        return;
      }

      const user = data.user;
      signIn({
        name: user.name,
        role: user.role,
        city: user.city || "Bengaluru",
      });

      router.push(homeForRole(user.role));
    } catch {
      setLoading(false);
      setErrors({ general: "Sign-in error. Please try again." });
    }
  }

  function quickFill(presetName: string, presetRole: Role) {
    setName(presetName);
    setPassword("password123");
    setErrors({});
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">Log in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter your account name and password to access Scrapo.
      </p>

      {errors.general && (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
          {errors.general}
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Account Name" htmlFor="login-name" error={errors.name}>
          <TextInput
            id="login-name"
            autoComplete="username"
            placeholder="e.g. Darsh Kaushal or Ananya Iyer"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "", general: "" }));
            }}
          />
        </Field>

        <Field label="Password" htmlFor="login-password" error={errors.password}>
          <div className="relative">
            <TextInput
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "", general: "" }));
              }}
              className="pr-20"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-olive hover:underline"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Signing in..." : "Log in"}
        </Button>
      </form>

      {/* Quick Access Demo Profiles */}
      <div className="mt-8 rounded-2xl border border-line bg-card/60 p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">
          Quick Demo Login
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => quickFill("Ananya Iyer", "donor")}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-left text-xs transition hover:border-olive hover:bg-lime/10"
          >
            <div className="font-semibold text-ink">Ananya Iyer</div>
            <div className="text-[11px] text-muted">Donor Desk</div>
          </button>
          <button
            type="button"
            onClick={() => quickFill("Arjun Deshpande", "student")}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-left text-xs transition hover:border-olive hover:bg-lime/10"
          >
            <div className="font-semibold text-ink">Arjun Deshpande</div>
            <div className="text-[11px] text-muted">Student Desk</div>
          </button>
          <button
            type="button"
            onClick={() => quickFill("GreenCircuit Collective", "recycler")}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-left text-xs transition hover:border-olive hover:bg-lime/10"
          >
            <div className="font-semibold text-ink">GreenCircuit</div>
            <div className="text-[11px] text-muted">Recycler Desk</div>
          </button>
          <button
            type="button"
            onClick={() => quickFill("Leela Thomas", "admin")}
            className="rounded-xl border border-line bg-paper px-3 py-2 text-left text-xs transition hover:border-olive hover:bg-lime/10"
          >
            <div className="font-semibold text-ink">Leela Thomas</div>
            <div className="text-[11px] text-muted">Admin Console</div>
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-semibold text-olive hover:underline">
          Reset password
        </Link>
        <Link href="/signup" className="font-semibold text-olive hover:underline">
          Create an account
        </Link>
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const { signIn } = usePrototype();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<Role>("donor");
  const [city, setCity] = useState("Bengaluru");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (name.trim().length < 2) nextErrors.name = "Please enter your full name or organisation name.";
    if (password.trim().length < 4) nextErrors.password = "Choose a password with at least 4 characters.";
    if (role === "admin") nextErrors.role = "Admin accounts cannot be self-registered.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          password: password.trim(),
          role,
          city: city.trim() || "Bengaluru",
        }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success || !data.user) {
        setErrors({ name: data.error || "Could not create account." });
        return;
      }

      const user = data.user;
      // Instant login - no phone OTP or email confirmation required
      signIn({
        name: user.name,
        role: user.role,
        city: user.city || city.trim() || "Bengaluru",
      });

      router.push(homeForRole(user.role));
    } catch {
      setLoading(false);
      setErrors({ name: "Network error. Please try again." });
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">Create an account</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Create an account with your name and password. No email or phone verification required.
      </p>

      <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
        <Field label="Your Name" htmlFor="signup-name" error={errors.name}>
          <TextInput
            id="signup-name"
            autoComplete="name"
            placeholder="e.g. Darsh Kaushal or GreenCircuit"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setErrors((prev) => ({ ...prev, name: "" }));
            }}
          />
        </Field>

        <Field label="Create Password" htmlFor="signup-password" error={errors.password}>
          <div className="relative">
            <TextInput
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="At least 4 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((prev) => ({ ...prev, password: "" }));
              }}
              className="pr-20"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-olive hover:underline"
              onClick={() => setShowPassword((v) => !v)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <Field label="City" htmlFor="signup-city">
          <TextInput
            id="signup-city"
            value={city}
            placeholder="Bengaluru, Kochi, Mumbai..."
            onChange={(e) => setCity(e.target.value)}
          />
        </Field>

        <Field label="I am joining as" htmlFor="signup-role" error={errors.role}>
          <SelectInput
            id="signup-role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value="donor">A donor (donating unused electronics)</option>
            <option value="student">A student (seeking study hardware)</option>
            <option value="recycler">A verified recycling partner</option>
          </SelectInput>
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Creating account..." : "Create Account & Enter Scrapo"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-olive hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const router = useRouter();
  const { signIn } = usePrototype();

  const [name, setName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Please enter your account name.");
      return;
    }
    if (newPassword.trim().length < 4) {
      setError("New password must be at least 4 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), newPassword: newPassword.trim() }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok || !data.success) {
        setError(data.error || "Could not update password.");
        return;
      }

      setSuccess(true);
      // Log user in automatically with new password
      signIn({
        name: name.trim(),
        role: "donor",
        city: "Bengaluru",
      });

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch {
      setLoading(false);
      setError("Network error. Please try again.");
    }
  }

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">Reset Password</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Enter your account name and choose a new password. No verification codes needed.
      </p>

      {error && (
        <div className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 p-3 text-xs font-semibold text-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 rounded-2xl border border-lime/40 bg-lime/10 p-3 text-xs font-semibold text-olive">
          Password updated! Redirecting to your dashboard...
        </div>
      )}

      <form className="mt-6 space-y-4" onSubmit={submit} noValidate>
        <Field label="Account Name" htmlFor="reset-name">
          <TextInput
            id="reset-name"
            placeholder="e.g. Darsh Kaushal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field label="New Password" htmlFor="reset-new-password">
          <TextInput
            id="reset-new-password"
            type="password"
            placeholder="At least 4 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" className="w-full" size="lg" disabled={loading || success}>
          {loading ? "Updating..." : "Update Password & Enter"}
        </Button>
      </form>

      <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-olive hover:underline">
        Back to log in
      </Link>
    </div>
  );
}
