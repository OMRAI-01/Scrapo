"use client";

import { useEffect, useState } from "react";

export function useLive<T>(key: string, load: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [data, setData] = useState<T | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancel = false;
    setPhase("loading");
    load()
      .then((value) => {
        if (cancel) return;
        setData(value);
        setPhase("ready");
      })
      .catch((error: unknown) => {
        if (cancel) return;
        setMessage(error instanceof Error ? error.message : "Could not load records.");
        setPhase("error");
      });
    return () => {
      cancel = true;
    };
    // load is read once per key. Callers change `key` when the query should rerun.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);

  return {
    phase,
    data,
    message,
    retry: () => setAttempt((value) => value + 1),
  };
}
