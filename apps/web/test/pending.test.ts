import { describe, expect, it } from "vitest";
import { PENDING_KEY, readPending, RETENTION_MS, type Pending } from "../lib/pending";
const operation: Pending = {
  version: 1,
  owner: "adult",
  profile: "profile",
  session: "session",
  createdAt: 100,
  kind: "message",
  payload: { requestId: "5a360c97-252a-4d4c-a0a7-0e2385b7225b", message: "dog", inputMode: "text" },
};
function storage() {
  const map = new Map<string, string>([[PENDING_KEY, JSON.stringify(operation)]]);
  return {
    getItem: (key: string) => map.get(key) || null,
    setItem: (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: (key: string) => {
      map.delete(key);
    },
  };
}
describe("bounded unresolved operations", () => {
  it("restores exact immutable payload before the deadline", () => {
    expect(readPending(storage(), "adult", "profile", "session", 101)).toEqual(operation);
  });
  it("removes raw text at the deadline without inventing a new UUID", () => {
    const port = storage();
    expect(readPending(port, "adult", "profile", "session", 100 + RETENTION_MS)?.kind).toBe(
      "expired",
    );
    expect(port.getItem(PENDING_KEY)).not.toContain("dog");
    expect(port.getItem(PENDING_KEY)).not.toContain("requestId");
  });
  it.each([
    ["other", "profile", "session"],
    ["adult", "other", "session"],
    ["adult", "profile", "other"],
  ])("clears mismatched ownership %s/%s/%s", (owner, profile, session) => {
    const port = storage();
    expect(readPending(port, owner, profile, session, 101)).toBeNull();
    expect(port.getItem(PENDING_KEY)).toBeNull();
  });
  it("rejects corrupted and future data", () => {
    const port = storage();
    port.setItem(PENDING_KEY, "{}");
    expect(readPending(port, "adult", "profile", "session", 101)).toBeNull();
    expect(readPending(storage(), "adult", "profile", "session", 99)).toBeNull();
  });
});
