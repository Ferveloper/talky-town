"use client";
import { useEffect } from "react";
import { PENDING_KEY, RETENTION_MS } from "@/lib/pending";
/** Runs across public/private navigation, including idle tabs. Only unresolved text is stored. */
export function PendingRetention() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    function sweep() {
      clearTimeout(timer);
      try {
        const raw = sessionStorage.getItem(PENDING_KEY);
        if (raw) {
          const record = JSON.parse(raw);
          if (record.kind !== "expired") {
            if (!Number.isFinite(record.createdAt) || record.createdAt > Date.now())
              sessionStorage.removeItem(PENDING_KEY);
            else if (Date.now() - record.createdAt >= RETENTION_MS) {
              sessionStorage.setItem(
                PENDING_KEY,
                JSON.stringify({
                  version: 1,
                  owner: record.owner,
                  profile: record.profile,
                  session: record.session,
                  createdAt: record.createdAt,
                  kind: "expired",
                }),
              );
            } else
              timer = setTimeout(
                sweep,
                Math.min(1000, record.createdAt + RETENTION_MS - Date.now()),
              );
          }
        }
      } catch {
        try {
          sessionStorage.removeItem(PENDING_KEY);
        } catch {
          /* Storage unavailable. */
        }
      }
      if (!timer) timer = setTimeout(sweep, 1000);
    }
    sweep();
    document.addEventListener("visibilitychange", sweep);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", sweep);
    };
  }, []);
  return null;
}
