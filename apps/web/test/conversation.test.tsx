// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type {
  ChildProfileResponse,
  MessageResponse,
  SessionResponse,
  TurnResponse,
  TurnsResponse,
} from "@talkytown/shared";
import { api, ApiError } from "../lib/api";
import { ConversationScreen } from "../components/conversation/conversation-screen";
import { PendingRetention } from "../components/safety/pending-retention";
import {
  PENDING_KEY,
  pendingKey,
  readPending,
  savePending,
  clearBrowserSession,
  RETENTION_MS,
} from "../lib/pending";
const state = vi.hoisted(() => ({ vocabulary: new Map<string, string[]>() }));
vi.mock("../lib/api", async (original) => ({
  ...(await original<typeof import("../lib/api")>()),
  api: vi.fn(),
}));
vi.mock("../components/layout/app-shell", () => ({
  useAdult: () => ({ adult: { id: "adult" }, vocabulary: state.vocabulary }),
}));
const session: SessionResponse = {
  id: "session",
  childProfileId: "profile",
  avatarCode: "luna",
  missionCode: null,
  mode: "free-talk",
  status: "active",
  missionProgress: 0,
  xpEarned: 0,
  aiProviderType: "mock",
  aiModel: "talkytown-mock",
  startedAt: "2026-10-11T10:00:00Z",
  endedAt: null,
};
const profile: ChildProfileResponse = {
  id: "profile",
  alias: "Star",
  age: 8,
  ageBand: "8-10",
  nativeLanguage: "es",
  targetLanguage: "en",
  learningLevel: "starter",
  avatarCode: "luna",
  xpTotal: 0,
  gamificationLevel: 1,
  streakDays: 0,
};
function turn(id: string, content: string, role: TurnResponse["role"] = "avatar"): TurnResponse {
  return {
    id,
    content,
    role,
    inputMode: "text",
    correction: { needed: false },
    xpAwarded: 0,
    createdAt: session.startedAt,
  };
}
const reply: MessageResponse = {
  childTurn: turn("child", "dog", "child"),
  avatarTurn: turn("reply", "A dog is an animal."),
  xpAwarded: 5,
  practicedVocabulary: ["dog"],
  awardedBadges: [],
  safety: { flagged: false },
  session: { ...session, xpEarned: 5 },
};
function defaultApi(path: string) {
  if (path.includes("turns"))
    return Promise.resolve({ items: [turn("opening", "Hello!")], nextCursor: null });
  if (path.includes("child-profiles")) return Promise.resolve(profile);
  return Promise.resolve(session);
}
beforeEach(() => {
  sessionStorage.clear();
  state.vocabulary.clear();
  vi.mocked(api).mockImplementation(defaultApi as typeof api);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("conversation boundaries", () => {
  it("late A completion preserves B and never paints A into the new screen", async () => {
    let resolve!: (response: MessageResponse) => void;
    const late = new Promise<MessageResponse>((r) => {
      resolve = r;
    });
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? late
        : path === "/conversations/sessions/B"
          ? Promise.resolve({ ...session, id: "B" })
          : defaultApi(path)) as typeof api);
    const view = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    const b = {
      version: 1 as const,
      owner: "adult",
      profile: "profile",
      session: "B",
      createdAt: Date.now(),
      kind: "message" as const,
      payload: {
        requestId: "00000000-0000-4000-8000-000000000002",
        message: "cat",
        inputMode: "text" as const,
      },
    };
    savePending(b);
    view.rerender(<ConversationScreen profileId="profile" sessionId="B" />);
    await screen.findByRole("button", { name: "Reintentar mensaje" });
    await act(async () => resolve(reply));
    expect(readPending(sessionStorage, "adult", "profile", "B")).toEqual(b);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toBeNull();
    expect(view.container.querySelectorAll(".bubble.child")).toHaveLength(0);
    expect(view.container.querySelectorAll(".celebration")).toHaveLength(0);
    expect(state.vocabulary.size).toBe(0);
  });
  it("logout removes every pending key and invalidates a late response", async () => {
    let resolve!: (response: MessageResponse) => void;
    const late = new Promise<MessageResponse>((r) => {
      resolve = r;
    });
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST" ? late : defaultApi(path)) as typeof api);
    const view = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    savePending({
      version: 1,
      owner: "adult",
      profile: "profile",
      session: "B",
      createdAt: Date.now(),
      kind: "message",
      payload: {
        requestId: "00000000-0000-4000-8000-000000000002",
        message: "cat",
        inputMode: "text",
      },
    });
    sessionStorage.setItem("talkytown.celebrations.v1", '["identifier-only"]');
    act(() => clearBrowserSession());
    await act(async () => resolve(reply));
    expect(sessionStorage.length).toBe(0);
    expect(view.container.querySelectorAll(".bubble")).toHaveLength(0);
    expect(state.vocabulary.size).toBe(0);
  });
  it("announces message XP separately from badges and suppresses replay celebrations", async () => {
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? Promise.resolve({ ...reply, awardedBadges: ["first-conversation"] })
        : defaultApi(path)) as typeof api);
    const view = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await screen.findByText("¡Nueva insignia!");
    expect(screen.getByText("¡Buen trabajo! +5 XP")).toBeVisible();
    expect(screen.getByText("¡Nueva insignia!")).not.toHaveTextContent("XP");
    const body = vi.mocked(api).mock.calls.find((call) => call[1] === "POST")![2];
    view.unmount();
    savePending({
      version: 1,
      owner: "adult",
      profile: "profile",
      session: "session",
      createdAt: Date.now(),
      kind: "message",
      payload: body as import("@talkytown/shared").SendMessageRequest,
    });
    const replay = render(<ConversationScreen profileId="profile" sessionId="session" />);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar mensaje" }));
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    expect(replay.container.querySelectorAll(".celebration")).toHaveLength(0);
  });
  it("waits for every history page, deduplicates turns and then enables composition", async () => {
    let resolve!: (value: TurnsResponse) => void;
    const second = new Promise<TurnsResponse>((r) => {
      resolve = r;
    });
    vi.mocked(api).mockImplementation(((path: string) =>
      path.includes("cursor")
        ? second
        : path.includes("turns")
          ? Promise.resolve({ items: [turn("opening", "Hello!")], nextCursor: "next" })
          : defaultApi(path)) as typeof api);
    const { container } = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() =>
      expect(api).toHaveBeenCalledWith(
        "/conversations/sessions/session/turns?limit=50&cursor=next",
      ),
    );
    expect(container.querySelectorAll(".bubble")).toHaveLength(0);
    await act(async () =>
      resolve({
        items: [turn("opening", "Hello!"), turn("next", "Let's practice.")],
        nextCursor: null,
      }),
    );
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    expect(container.querySelectorAll(".bubble")).toHaveLength(2);
  });
  it("keeps UUID/body immutable across failure and explicit retry, blocks duplicate sends and hides unaccepted text", async () => {
    let reject!: (error: Error) => void;
    const lost = new Promise((_r, r) => {
      reject = r;
    });
    let attempts = 0;
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? ++attempts === 1
          ? lost
          : Promise.resolve(reply)
        : defaultApi(path)) as typeof api);
    const { container } = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    const send = screen.getByRole("button", { name: "Enviar mensaje" });
    fireEvent.click(send);
    fireEvent.click(send);
    expect(attempts).toBe(1);
    expect(container.querySelector(".bubble.child")).toBeNull();
    expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue("");
    await act(async () => reject(new ApiError(504, { code: "BACKEND_TIMEOUT" })));
    fireEvent.click(screen.getByRole("button", { name: "Reintentar mensaje" }));
    await waitFor(() => expect(container.querySelector(".bubble.child")).toHaveTextContent("dog"));
    const posts = vi.mocked(api).mock.calls.filter((call) => call[1] === "POST");
    expect(posts[0]?.[2]).toEqual(posts[1]?.[2]);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toBeNull();
    expect(container.querySelector(".celebration")).toHaveTextContent("+5 XP");
  });
  it("clears all cached turns and raw pending text on a safety-review response", async () => {
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? Promise.reject(new ApiError(409, { code: "SAFETY_REVIEW_REQUIRED" }))
        : defaultApi(path)) as typeof api);
    const { container } = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    await waitFor(() => expect(screen.getByText(/revisión de un administrador/)).toBeVisible());
    expect(container.querySelectorAll(".bubble")).toHaveLength(0);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toBeNull();
    expect(screen.getByLabelText("Tu mensaje en inglés")).toBeDisabled();
  });
  it("never renders a session under a different profile route", async () => {
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        version: 1,
        owner: "adult",
        profile: "other",
        session: "session",
        createdAt: Date.now(),
        kind: "message",
        payload: {
          requestId: "00000000-0000-4000-8000-000000000001",
          message: "dog",
          inputMode: "text",
        },
      }),
    );
    vi.mocked(api).mockImplementation(((path: string) =>
      path.includes("sessions")
        ? Promise.resolve({ ...session, childProfileId: "other" })
        : defaultApi(path)) as typeof api);
    const { container } = render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(container.querySelectorAll(".bubble")).toHaveLength(0);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toBeNull();
    expect(readPending(sessionStorage, "adult", "other", "session")?.kind).toBe("message");
    expect(vi.mocked(api).mock.calls.some((call) => call[0].includes("turns"))).toBe(false);
  });
  it("deletes pending raw text in an idle tab at the retention deadline", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    sessionStorage.setItem(
      PENDING_KEY,
      JSON.stringify({
        version: 1,
        owner: "adult",
        profile: "profile",
        session: "session",
        createdAt: 1000,
        kind: "message",
        payload: {
          requestId: "00000000-0000-4000-8000-000000000001",
          message: "unresolved child text",
          inputMode: "text",
        },
      }),
    );
    render(<PendingRetention />);
    act(() => vi.advanceTimersByTime(250));
    savePending({
      version: 1,
      owner: "adult",
      profile: "profile",
      session: "B",
      createdAt: Date.now(),
      kind: "message",
      payload: {
        requestId: "00000000-0000-4000-8000-000000000002",
        message: "other unresolved text",
        inputMode: "text",
      },
    });
    act(() => vi.advanceTimersByTime(RETENTION_MS - 250));
    expect(
      sessionStorage.getItem(
        pendingKey({ owner: "adult", profile: "profile", session: "session" }),
      ),
    ).not.toContain("unresolved child text");
    expect(readPending(sessionStorage, "adult", "profile", "session")?.kind).toBe("expired");
    expect(readPending(sessionStorage, "adult", "profile", "B")?.kind).toBe("message");
    act(() => vi.advanceTimersByTime(250));
    expect(readPending(sessionStorage, "adult", "profile", "B")?.kind).toBe("expired");
    expect(Object.values(sessionStorage).join("")).not.toContain("unresolved");
  });
});
