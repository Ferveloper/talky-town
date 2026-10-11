import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPending,
  expirePending,
  PENDING_KEY,
  pendingKey,
  readPending,
  RETENTION_MS,
  savePending,
  sweepPending,
  type Pending,
} from "../lib/pending";
const operation: Pending = {
  version: 1,
  owner: "adult",
  profile: "profile",
  session: "session",
  createdAt: 100,
  kind: "message",
  payload: { requestId: "5a360c97-252a-4d4c-a0a7-0e2385b7225b", message: "dog", inputMode: "text" },
};
function storage(legacy = false) {
  const map = new Map<string, string>([
    [legacy ? PENDING_KEY : pendingKey(operation), JSON.stringify(operation)],
  ]);
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => [...map.keys()][index] || null,
    getItem: (key: string) => map.get(key) || null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(101);
});
afterEach(() => vi.useRealTimers());
describe("operation-scoped immutable recovery", () => {
  it("keeps the in-memory fallback when accessing browser storage itself is denied", () => {
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage denied");
      },
    });
    try {
      expect(savePending(operation)).toBe(false);
      expect(() => clearPending(operation)).not.toThrow();
      expect(expirePending(operation).kind).toBe("expired");
    } finally {
      Reflect.deleteProperty(globalThis, "sessionStorage");
    }
  });
  it("restores the exact UUID/body and migrates the original legacy deadline", () => {
    const port = storage(true);
    expect(readPending(port, "adult", "profile", "session", 101)).toEqual(operation);
    expect(port.getItem(PENDING_KEY)).toBeNull();
    expect(port.getItem(pendingKey(operation))).toBe(JSON.stringify(operation));
  });
  it.each(["start", "another-session"])("reading %s preserves the original session", (session) => {
    const port = storage();
    expect(readPending(port, "adult", "profile", session)).toBeNull();
    expect(readPending(port, "adult", "profile", "session")).toEqual(operation);
  });
  it("navigation to another profile preserves unresolved text for the same adult", () => {
    const port = storage();
    expect(readPending(port, "adult", "other-profile", "start")).toBeNull();
    expect(readPending(port, "adult", "profile", "session")).toEqual(operation);
  });
  it("purges text belonging to another authenticated adult", () => {
    const port = storage();
    expect(readPending(port, "other-adult", "profile", "session")).toBeNull();
    expect(port.length).toBe(0);
  });
  it("late completion of A cannot delete an independent B operation", () => {
    const port = storage();
    const b: Pending = { ...operation, session: "B" };
    expect(savePending(b, port)).toBe(true);
    clearPending(operation, port);
    expect(readPending(port, "adult", "profile", "B")).toEqual(b);
  });
  it("clear and expiration require the immutable UUID even in the same context", () => {
    const port = storage();
    const old: Pending = {
      ...operation,
      payload: { ...operation.payload, requestId: "00000000-0000-4000-8000-000000000001" },
    };
    clearPending(old, port);
    expirePending(old, port);
    expect(readPending(port, "adult", "profile", "session")).toEqual(operation);
  });
  it("retry cannot renew the deadline or change the request body", () => {
    const port = storage();
    expect(savePending(operation, port)).toBe(true);
    expect(savePending({ ...operation, createdAt: 101 }, port)).toBe(false);
    expect(
      savePending({ ...operation, payload: { ...operation.payload, message: "cat" } }, port),
    ).toBe(false);
    expect(readPending(port, "adult", "profile", "session")).toEqual(operation);
  });
  it("expires every key at the original deadline, retaining only non-text identity", () => {
    const port = storage();
    const b: Pending = { ...operation, session: "B", createdAt: 101 };
    savePending(b, port);
    sweepPending(port, 100 + RETENTION_MS);
    expect(readPending(port, "adult", "profile", "session", 100 + RETENTION_MS)).toEqual({
      version: 1,
      owner: "adult",
      profile: "profile",
      session: "session",
      createdAt: 100,
      kind: "expired",
      requestId: operation.payload.requestId,
    });
    expect(port.getItem(pendingKey(operation))).not.toContain("dog");
    expect(readPending(port, "adult", "profile", "B", 100 + RETENTION_MS)?.kind).toBe("message");
    sweepPending(port, 101 + RETENTION_MS);
    expect(port.getItem(pendingKey(b))).not.toContain("dog");
  });
  it("an expired timer cannot resurrect text after clearing", () => {
    const port = storage();
    clearPending(operation, port);
    expirePending(operation, port);
    expect(port.length).toBe(0);
  });
  it("rejects corruption, misplaced keys and future timestamps across all slots", () => {
    const port = storage();
    port.setItem(pendingKey({ ...operation, session: "bad" }), "{}");
    port.setItem(pendingKey({ ...operation, session: "wrong" }), JSON.stringify(operation));
    sweepPending(port, 99);
    expect(port.length).toBe(0);
  });
});
