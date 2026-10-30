"use client";

import { useEffect, useState } from "react";

type Phase = "loading" | "ready" | "error";

export function useDemoResource(key: string, forceError = false) {
  const token = `${key}:${forceError ? "error" : "ok"}`;
  const [tracked, setTracked] = useState(token);
  const [phase, setPhase] = useState<Phase>("loading");
  const [attempt, setAttempt] = useState(0);

  if (tracked !== token) {
    setTracked(token);
    setPhase("loading");
    setAttempt(0);
  }

  useEffect(() => {
    const showError = token.endsWith(":error") && attempt === 0;
    const timer = window.setTimeout(() => {
      setPhase(showError ? "error" : "ready");
    }, 520);
    return () => window.clearTimeout(timer);
  }, [attempt, token]);

  return {
    phase,
    retry: () => {
      setAttempt((value) => value + 1);
      setPhase("loading");
    },
  };
}
