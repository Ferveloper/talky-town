"use client";
import { useEffect } from "react";
import { sweepPending } from "@/lib/pending";
/** Runs across public/private navigation, including idle tabs. */
export function PendingRetention() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const sweep = () => {
      clearTimeout(timer);
      let delay = 1000;
      try {
        delay = sweepPending(sessionStorage);
      } catch {
        /* Storage unavailable. */
      }
      timer = setTimeout(sweep, delay);
    };
    sweep();
    document.addEventListener("visibilitychange", sweep);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sweep);
    };
  }, []);
  return null;
}
