"use client";

import { ErrorState } from "@/components/ui/feedback";

export default function ConsoleError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="This screen hit a problem"
      text="The prototype view failed to render. Retry it. No account data was sent."
      onRetry={reset}
    />
  );
}
