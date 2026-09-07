import { useEffect, useState } from "react";

const DEFAULT_INTERVAL_MS = 60 * 1000;

/**
 * The current time as epoch milliseconds, refreshed on an interval.
 *
 * Use this instead of `Date.now()` in render so that time-dependent UI
 * updates without a page reload.
 */
export default function useNow(intervalMs = DEFAULT_INTERVAL_MS): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}
