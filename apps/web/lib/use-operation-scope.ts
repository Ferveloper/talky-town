"use client";
import { useEffect, useRef } from "react";
/** Invalidates late UI updates on navigation, identity change, logout and expiry. */
export function useOperationScope(identity: string, clear: () => void) {
  const generation = useRef(0);
  const latest = useRef(clear);
  latest.current = clear;
  useEffect(() => {
    const invalidate = () => {
      generation.current++;
      latest.current();
    };
    window.addEventListener("talkytown:session-cleared", invalidate);
    return () => {
      generation.current++;
      window.removeEventListener("talkytown:session-cleared", invalidate);
    };
  }, [identity]);
  return () => {
    const captured = generation.current;
    return () => captured === generation.current;
  };
}
