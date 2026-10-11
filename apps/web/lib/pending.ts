import type { SendMessageRequest, StartSessionRequest } from "@talkytown/shared";
export const RETENTION_MS = 15 * 60 * 1000;
export const PENDING_KEY = "talkytown.pending.v1";
export const PENDING_PREFIX = "talkytown.pending.v2:";
export type Pending = {
  version: 1;
  owner: string;
  profile: string;
  session: string;
  createdAt: number;
} & (
  | { kind: "start"; payload: StartSessionRequest }
  | { kind: "message"; payload: SendMessageRequest }
  | { kind: "expired"; requestId: string }
);
type StoragePort = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function pendingKey(value: Pick<Pending, "owner" | "profile" | "session">) {
  return PENDING_PREFIX + JSON.stringify([value.owner, value.profile, value.session]);
}
function requestId(value: Pending) {
  return value.kind === "expired" ? value.requestId : value.payload.requestId;
}
function keys(storage: StoragePort) {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => !!key && (key === PENDING_KEY || key.startsWith(PENDING_PREFIX)),
  );
}
function parse(raw: string | null, now: number): Pending | null {
  try {
    const value = JSON.parse(raw || "null") as Pending;
    if (
      !value ||
      value.version !== 1 ||
      typeof value.owner !== "string" ||
      !value.owner ||
      typeof value.profile !== "string" ||
      !value.profile ||
      typeof value.session !== "string" ||
      !value.session ||
      !Number.isFinite(value.createdAt) ||
      value.createdAt > now ||
      !["start", "message", "expired"].includes(value.kind) ||
      !uuid.test(requestId(value))
    )
      return null;
    if (
      value.kind === "message" &&
      (typeof value.payload.message !== "string" ||
        !value.payload.message.trim() ||
        value.payload.message.length > 500 ||
        (value.payload.inputMode !== "text" && value.payload.inputMode !== "voice"))
    )
      return null;
    if (
      value.kind === "start" &&
      (value.payload.childProfileId !== value.profile ||
        !["free-talk", "guided-mission"].includes(value.payload.mode))
    )
      return null;
    if (value.kind === "expired" || now - value.createdAt >= RETENTION_MS)
      return {
        version: 1,
        owner: value.owner,
        profile: value.profile,
        session: value.session,
        createdAt: value.createdAt,
        kind: "expired",
        requestId: requestId(value),
      };
    return value;
  } catch {
    return null;
  }
}
/** Sweeps every operation and migrates the legacy slot without renewing its deadline. */
export function sweepPending(storage: StoragePort, now = Date.now(), owner?: string) {
  let nextSweep = 1000;
  for (const key of keys(storage)) {
    const value = parse(storage.getItem(key), now);
    if (
      !value ||
      (owner !== undefined && value.owner !== owner) ||
      (key !== PENDING_KEY && key !== pendingKey(value))
    )
      storage.removeItem(key);
    else {
      if (value.kind !== "expired")
        nextSweep = Math.min(nextSweep, value.createdAt + RETENTION_MS - now);
      if (key === PENDING_KEY) {
        if (!storage.getItem(pendingKey(value)))
          storage.setItem(pendingKey(value), JSON.stringify(value));
        storage.removeItem(key);
      } else storage.setItem(key, JSON.stringify(value));
    }
  }
  return nextSweep;
}
export function readPending(
  storage: StoragePort,
  owner: string,
  profile: string,
  session: string,
  now = Date.now(),
): Pending | null {
  try {
    sweepPending(storage, now, owner);
    return parse(storage.getItem(pendingKey({ owner, profile, session })), now);
  } catch {
    return null;
  }
}
export function savePending(value: Pending, storage?: StoragePort): boolean {
  try {
    storage ||= sessionStorage;
    const key = pendingKey(value);
    const current = storage.getItem(key);
    if (current) {
      const original = parse(current, Date.now());
      // Preserve the original UUID, body and retention deadline on every retry.
      return !!original && JSON.stringify(original) === JSON.stringify(value);
    }
    const valid = parse(JSON.stringify(value), Date.now());
    if (!valid) return false;
    storage.setItem(key, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}
export function expirePending(value: Pending, storage?: StoragePort): Pending {
  const expired: Pending = {
    version: 1,
    owner: value.owner,
    profile: value.profile,
    session: value.session,
    createdAt: value.createdAt,
    kind: "expired",
    requestId: requestId(value),
  };
  try {
    storage ||= sessionStorage;
    const key = pendingKey(value);
    const current = parse(storage.getItem(key), Date.now());
    if (current && requestId(current) === requestId(value))
      storage.setItem(key, JSON.stringify(expired));
  } catch {
    /* In-memory expiration still removes text. */
  }
  return expired;
}
export function clearPending(value: Pending, storage?: StoragePort) {
  try {
    storage ||= sessionStorage;
    const key = pendingKey(value);
    const current = parse(storage.getItem(key), Date.now());
    if (current && requestId(current) === requestId(value)) storage.removeItem(key);
  } catch {
    /* In-memory flow still works. */
  }
}
export function clearBrowserSession() {
  try {
    for (const key of keys(sessionStorage)) sessionStorage.removeItem(key);
    sessionStorage.removeItem("talkytown.celebrations.v1");
  } catch {
    /* Storage can be unavailable. */
  }
  window.dispatchEvent(new Event("talkytown:session-cleared"));
}
export function celebrateOnce(key: string): boolean {
  try {
    const keys: string[] = JSON.parse(sessionStorage.getItem("talkytown.celebrations.v1") || "[]");
    if (keys.includes(key)) return false;
    sessionStorage.setItem("talkytown.celebrations.v1", JSON.stringify([...keys, key].slice(-200)));
    return true;
  } catch {
    return false;
  }
}
