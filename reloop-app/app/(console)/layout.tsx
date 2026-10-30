import { Suspense, type ReactNode } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/ui/feedback";

export default function ConsoleLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="px-4 py-6 sm:px-6"><PageSkeleton /></div>}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
