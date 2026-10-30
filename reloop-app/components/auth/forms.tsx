"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field, SelectInput, TextInput } from "@/components/ui/field";
import { homeForRole } from "@/lib/prototype/model";
import { usePrototype } from "@/lib/prototype/session";
import type { Role } from "@/lib/types";

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "Guest";
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function LoginForm() {
  const router = useRouter();
  const { signIn } = usePrototype();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("donor");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: { email?: string; password?: string } = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter an email address.";
    if (password.length < 8) next.password = "Use at least 8 characters. It stays on this page.";
    setErrors(next);
    if (Object.keys(next).length) return;
    signIn({ name: nameFromEmail(email), email, role });
    router.push(homeForRole(role));
  }

  function enterDemo(nextRole: Role, name: string, emailAddress: string) {
    signIn({ name, email: emailAddress, role: nextRole });
    router.push(homeForRole(nextRole));
  }

  return (
    <div>
      <h1 className="text-4xl font-medium tracking-tight">Log in</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        This form does not contact a server. Pick a role to open the matching prototype desk.
      </p>
      <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="Checked for length only.">
          <div className="relative">
            <TextInput
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-20"
            />
            <button
              type="button"
              className="absolute top-1/2 right-3 -translate-y-1/2 text-xs font-semibold text-olive"
              onClick={() => setShow((value) => !value)}
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
        </Field>
        <Field label="Open as" htmlFor="role">
          <SelectInput id="role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="donor">Donor</option>
            <option value="student">Student</option>
            <option value="recycler">Recycler</option>
            <option value="admin">Admin preview</option>
          </SelectInput>
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Continue
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="font-semibold text-olive">
          Forgot password
        </Link>
        <Link href="/signup" className="font-semibold text-olive">
          Create an account
        </Link>
      </div>
      <div className="mt-8 rounded-3xl border border-line bg-card p-4">
        <p className="text-sm font-semibold">Sample profiles</p>
        <div className="mt-3 grid gap-2">
          <Button variant="ghost" onClick={() => enterDemo("donor", "Ananya Iyer", "ananya.iyer@example.com")}>
            Continue as Ananya, donor
          </Button>
          <Button variant="ghost" onClick={() => enterDemo("recycler", "Priya Nair", "priya.nair@greencircuit.example")}>
            Continue as Priya, recycler
          </Button>
          <Button variant="ghost" onClick={() => enterDemo("admin", "Leela Thomas", "leela.thomas@scrapo.example")}>
            Continue as Leela, admin
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("donor");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Add the name you want on the board.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter an email address.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const params = new URLSearchParams({
      status: "sent",
      name: name.trim(),
      email: email.trim(),
      role,
    });
    router.push(`/verify-email?${params.toString()}`);
  }

  return (
    <div>
      <h1 className="text-4xl font-medium tracking-tight">Create an account</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Admin access is a preview on the login screen. Recycler accounts in the real product would wait for license review.
      </p>
      <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
        <Field label="Name" htmlFor="name" error={errors.name}>
          <TextInput id="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Email" htmlFor="signup-email" error={errors.email}>
          <TextInput
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password" htmlFor="signup-password" error={errors.password}>
          <TextInput
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Field label="I am joining as" htmlFor="signup-role">
          <SelectInput id="signup-role" value={role} onChange={(event) => setRole(event.target.value as Role)}>
            <option value="donor">A donor</option>
            <option value="student">A student</option>
            <option value="recycler">A recycler</option>
          </SelectInput>
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Continue to verification
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted">
        Already have a prototype session?{" "}
        <Link href="/login" className="font-semibold text-olive">
          Log in
        </Link>
      </p>
    </div>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter the email you would use for Scrapo.");
      return;
    }
    setError("");
    setSent(true);
  }

  if (sent) {
    return (
      <div>
        <h1 className="text-4xl font-medium tracking-tight">Check your inbox</h1>
        <p className="mt-3 text-sm leading-6 text-muted">
          In the live product, a reset link would go to <span className="font-semibold text-ink">{email}</span>. This prototype does not send email.
        </p>
        <Button href="/login" className="mt-8" variant="olive">
          Back to log in
        </Button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-medium tracking-tight">Forgot password</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        Tell us which email to use. No message leaves this browser.
      </p>
      <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
        <Field label="Email" htmlFor="reset-email" error={error}>
          <TextInput
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" size="lg">
          Show the sent state
        </Button>
      </form>
      <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-olive">
        Back to log in
      </Link>
    </div>
  );
}
