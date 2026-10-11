import type { SendMessageRequest, StartSessionRequest } from "@talkytown/shared";
export const RETENTION_MS = 15 * 60 * 1000;
export const PENDING_KEY = "talkytown.pending.v1";
export type Pending = {
  version: 1;
  owner: string;
  profile: string;
  session: string;
  createdAt: number;
} & (
  | { kind: "start"; payload: StartSessionRequest }
  | { kind: "message"; payload: SendMessageRequest }
  | { kind: "expired" }
);
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem">;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function readPending(
  storage: StoragePort,
  owner: string,
  profile: string,
  session: string,
  now = Date.now(),
): Pending | null {
  try {
    const raw = storage.getItem(PENDING_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Pending;
    if (
      value.version !== 1 ||
      value.owner !== owner ||
      value.profile !== profile ||
      value.session !== session ||
      typeof value.createdAt !== "number" ||
      value.createdAt > now ||
      !["start", "message", "expired"].includes(value.kind)
    ) {
      storage.removeItem(PENDING_KEY);
      return null;
    }
    if (value.kind === "expired") return value;
    if (!value.payload || !uuid.test(value.payload.requestId)) {
      storage.removeItem(PENDING_KEY);
      return null;
    }
    if (
      value.kind === "message" &&
      (typeof value.payload.message !== "string" ||
        !value.payload.message.trim() ||
        value.payload.message.length > 500 ||
        value.payload.inputMode !== "text")
    ) {
      storage.removeItem(PENDING_KEY);
      return null;
    }
    if (
      value.kind === "start" &&
      (value.payload.childProfileId !== profile ||
        !["free-talk", "guided-mission"].includes(value.payload.mode))
    ) {
      storage.removeItem(PENDING_KEY);
      return null;
    }
    if (now - value.createdAt >= RETENTION_MS) {
      const expired: Pending = {
        version: 1,
        owner,
        profile,
        session,
        createdAt: value.createdAt,
        kind: "expired",
      };
      storage.setItem(PENDING_KEY, JSON.stringify(expired));
      return expired;
    }
    return value;
  } catch {
    try {
      storage.removeItem(PENDING_KEY);
    } catch {
      /* Storage can be unavailable. */
    }
    return null;
  }
}
export function savePending(value: Pending): boolean {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
export function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* In-memory flow still works. */
  }
}
export function clearBrowserSession() {
  clearPending();
  try {
    sessionStorage.removeItem("talkytown.celebrations.v1");
  } catch {
    /* Storage can be unavailable. */
  }
}
export function celebrateOnce(key: string): boolean {
  try {
    const keys: string[] = JSON.parse(sessionStorage.getItem("talkytown.celebrations.v1") || "[]");
    if (keys.includes(key)) return false;
    sessionStorage.setItem("talkytown.celebrations.v1", JSON.stringify([...keys, key].slice(-200)));
    return true;
  } catch {
    return false;
  } // Suppress celebrations when deduplication is unavailable.
}
