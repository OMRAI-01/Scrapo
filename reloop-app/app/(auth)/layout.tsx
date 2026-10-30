import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = {
  title: "Account",
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-olive px-10 py-10 text-paper lg:block">
        <Logo tone="lime" />
        <p className="mt-16 max-w-sm font-display text-4xl leading-tight font-medium">
          Give electronics a second life.
        </p>
        <p className="mt-4 max-w-sm text-sm leading-6 text-paper/80">
          Accounts on this prototype live in your browser. A password is checked for length only. It is never sent anywhere.
        </p>
        <p className="absolute right-8 bottom-8 text-sm text-lime">Collect . Refurbish . Donate .</p>
      </aside>
      <div className="flex flex-col px-4 py-6 sm:px-8">
        <div className="mb-8 flex items-center justify-between lg:hidden">
          <Logo />
          <Link href="/" className="text-sm font-semibold text-olive">
            Back home
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-6">{children}</div>
      </div>
    </div>
  );
}
