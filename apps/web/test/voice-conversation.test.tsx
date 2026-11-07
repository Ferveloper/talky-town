// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MessageResponse, SessionResponse, TurnResponse } from "@talkytown/shared";
import { reviewedSafetyResponses } from "@talkytown/shared";
import { api, ApiError } from "../lib/api";
import { ConversationScreen } from "../components/conversation/conversation-screen";
import { clearBrowserSession, readPending, savePending, RETENTION_MS } from "../lib/pending";
import {
  FakeRecognition,
  installRecognition,
  installSynthesis,
  runningRecognition,
} from "./speech-fakes";
const identity = vi.hoisted(() => ({
  adult: { id: "adult" },
  vocabulary: new Map<string, string[]>(),
}));
vi.mock("../components/layout/app-shell", () => ({
  useAdult: () => ({ ...identity, recognitionMode: "local-only" }),
}));
vi.mock("../lib/api", async (original) => ({
  ...(await original<typeof import("../lib/api")>()),
  api: vi.fn(),
}));
const session = {
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
} satisfies SessionResponse;
const turn = (id: string, content: string, role: "avatar" | "child" = "avatar"): TurnResponse => ({
  id,
  content,
  role,
  inputMode: role === "child" ? "voice" : "text",
  correction: { needed: false },
  xpAwarded: role === "child" ? 5 : 0,
  createdAt: session.startedAt,
});
const reply: MessageResponse = {
  session: { ...session, xpEarned: 5 },
  childTurn: turn("child", "dog", "child"),
  avatarTurn: turn("reply", "A dog is an animal."),
  xpAwarded: 5,
  practicedVocabulary: ["dog"],
  awardedBadges: [],
  safety: { flagged: false },
};
function restore(path: string) {
  if (path.includes("turns"))
    return Promise.resolve({ items: [turn("opening", "Hello!")], nextCursor: null });
  if (path.includes("child-profiles"))
    return Promise.resolve({ id: "profile", alias: "Star", avatarCode: "luna", age: 8 });
  return Promise.resolve(session);
}
beforeEach(() => {
  identity.adult.id = "adult";
  identity.vocabulary.clear();
  sessionStorage.clear();
  installRecognition();
  installSynthesis();
  vi.mocked(api).mockImplementation(restore as typeof api);
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "SpeechRecognition");
  Reflect.deleteProperty(window, "speechSynthesis");
  Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
});
async function mount() {
  const view = render(<ConversationScreen profileId="profile" sessionId="session" />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Usar micrófono" })).toBeEnabled());
  return view;
}
function recognize(text: string) {
  fireEvent.click(screen.getByRole("button", { name: "Usar micrófono" }));
  const engine = runningRecognition();
  act(() => {
    engine.onstart?.();
    engine.result(text);
    engine.onend?.();
  });
  return engine;
}
describe("reviewed voice conversation integration", () => {
  it("creates no UUID or browser draft storage before confirmation; edited voice sends once", async () => {
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST" ? Promise.resolve(reply) : restore(path)) as typeof api);
    await mount();
    const uuid = vi.spyOn(crypto, "randomUUID");
    recognize("dog draft");
    expect(uuid).not.toHaveBeenCalled();
    expect(sessionStorage.length).toBe(0);
    expect(vi.mocked(api).mock.calls.some((call) => call[1] === "POST")).toBe(false);
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), { target: { value: "dog" } });
    const confirm = screen.getByRole("button", { name: "Confirmar y enviar transcripción" });
    fireEvent.click(confirm);
    fireEvent.click(confirm);
    await screen.findByText("A dog is an animal.");
    expect(uuid).toHaveBeenCalledTimes(1);
    expect(vi.mocked(api).mock.calls.filter((call) => call[1] === "POST")).toHaveLength(1);
    expect(vi.mocked(api).mock.calls.find((call) => call[1] === "POST")?.[2]).toMatchObject({
      message: "dog",
      inputMode: "voice",
    });
  });
  it("silence and discard never send; text remains usable", async () => {
    await mount();
    recognize(" ");
    expect(screen.getByRole("button", { name: "Enviar mensaje" })).toBeDisabled();
    recognize("dog");
    fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
    expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue("");
    expect(sessionStorage.length).toBe(0);
    expect(vi.mocked(api).mock.calls.some((call) => call[1] === "POST")).toBe(false);
  });
  it("requires editing a 501-character transcript but accepts exactly 500", async () => {
    await mount();
    recognize("a".repeat(501));
    expect(screen.getByRole("button", { name: "Confirmar y enviar transcripción" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), {
      target: { value: "a".repeat(500) },
    });
    expect(screen.getByRole("button", { name: "Confirmar y enviar transcripción" })).toBeEnabled();
  });
  it("preserves voice tuple and original timestamp across navigation/reload and explicit retry", async () => {
    let attempts = 0;
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? ++attempts === 1
          ? Promise.reject(new ApiError(504, { code: "BACKEND_TIMEOUT" }))
          : Promise.resolve(reply)
        : restore(path)) as typeof api);
    const view = await mount();
    recognize("dog");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y enviar transcripción" }));
    await screen.findByRole("button", { name: "Reintentar mensaje" });
    const original = readPending(sessionStorage, "adult", "profile", "session")!;
    const b = { ...original, session: "B" };
    expect(savePending(b)).toBe(true);
    view.unmount();
    render(<ConversationScreen profileId="profile" sessionId="session" />);
    const retry = await screen.findByRole("button", { name: "Reintentar mensaje" });
    expect(attempts).toBe(1);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toEqual(original);
    fireEvent.click(retry);
    await screen.findByText("A dog is an animal.");
    const posts = vi.mocked(api).mock.calls.filter((call) => call[1] === "POST");
    expect(posts[0]?.[2]).toEqual(posts[1]?.[2]);
    expect(readPending(sessionStorage, "adult", "profile", "session")).toBeNull();
    expect(readPending(sessionStorage, "adult", "profile", "B")).toEqual(b);
  });
  it("late native callbacks cannot write into another session or a pending send", async () => {
    const view = await mount();
    fireEvent.click(screen.getByRole("button", { name: "Usar micrófono" }));
    const engine = runningRecognition();
    const late = engine.onresult!;
    const ended = engine.onend!;
    view.rerender(<ConversationScreen profileId="profile" sessionId="B" />);
    act(() => {
      late({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "old draft" } }] });
      ended();
    });
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue(""));
    expect(engine.aborts).toBe(1);
  });
  it("shows listening only after native start and speaking only after audio start; mic cancels audio", async () => {
    const synthesis = installSynthesis();
    const view = await mount();
    fireEvent.click(screen.getByRole("button", { name: "Escuchar respuesta" }));
    expect(view.container.querySelector(".avatar-display.speaking")).toBeNull();
    act(() => synthesis.utterances[0]?.onstart?.());
    expect(view.container.querySelector(".avatar-display.speaking")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Usar micrófono" }));
    expect(synthesis.cancellations).toBe(1);
    expect(view.container.querySelector(".avatar-display.listening")).toBeNull();
    act(() => runningRecognition().onstart?.());
    expect(view.container.querySelector(".avatar-display.listening")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Descartar voz" }));
    expect(view.container.querySelector(".avatar-display.listening")).toBeNull();
  });
  it("restored wellbeing response uses Spanish and has no automatic playback", async () => {
    const synthesis = installSynthesis();
    const content = reviewedSafetyResponses.distress["8-10"];
    vi.mocked(api).mockImplementation(((path: string) =>
      path.includes("turns")
        ? Promise.resolve({ items: [turn("support", content)], nextCursor: null })
        : restore(path)) as typeof api);
    await mount();
    expect(synthesis.utterances).toHaveLength(0);
    expect(screen.getByText(content)).toHaveAttribute("lang", "es");
    fireEvent.click(screen.getByRole("button", { name: "Escuchar respuesta" }));
    expect(synthesis.utterances[0]?.voice?.lang).toBe("es-ES");
    expect(synthesis.utterances[0]?.text).toBe(content);
  });
  it("blocked response creates no child bubble, vocabulary or XP celebration", async () => {
    vi.mocked(api).mockImplementation(((path: string, method?: string) =>
      method === "POST"
        ? Promise.resolve({
            ...reply,
            childTurn: null,
            xpAwarded: 0,
            practicedVocabulary: [],
            awardedBadges: [],
            session,
            safety: { flagged: true, reason: "serious-distress" },
            avatarTurn: turn("support", reviewedSafetyResponses.distress["8-10"]),
          })
        : restore(path)) as typeof api);
    const view = await mount();
    recognize("Nobody cares about me");
    fireEvent.click(screen.getByRole("button", { name: "Confirmar y enviar transcripción" }));
    await screen.findByText(reviewedSafetyResponses.distress["8-10"]);
    expect(view.container.querySelector(".bubble.child")).toBeNull();
    expect(view.container.querySelector(".celebration")).toBeNull();
    expect(identity.vocabulary.size).toBe(0);
  });
  it("hiding clears unconfirmed voice while preserving an ordinary typed draft", async () => {
    await mount();
    fireEvent.change(screen.getByLabelText("Tu mensaje en inglés"), {
      target: { value: "typed draft" },
    });
    const hidden = vi.spyOn(document, "hidden", "get");
    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue("typed draft");
    hidden.mockReturnValue(false);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    fireEvent.click(screen.getByRole("button", { name: "Descartar borrador" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Usar micrófono" })).toBeEnabled(),
    );
    recognize("unconfirmed voice");
    hidden.mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue("");
    expect(sessionStorage.length).toBe(0);
  });
  it("logout clears pending voice text and stops recognition", async () => {
    const view = await mount();
    recognize("unconfirmed");
    act(() => clearBrowserSession());
    expect(sessionStorage.length).toBe(0);
    expect(view.container.querySelectorAll(".bubble")).toHaveLength(0);
    expect(screen.getByLabelText("Tu mensaje en inglés")).toHaveValue("");
  });
  it("expires pending voice text at its original deadline", async () => {
    await mount();
    const original = {
      version: 1 as const,
      owner: "adult",
      profile: "profile",
      session: "session",
      createdAt: Date.now() - RETENTION_MS,
      kind: "message" as const,
      payload: {
        requestId: "00000000-0000-4000-8000-000000000001",
        message: "private pending fixture",
        inputMode: "voice" as const,
      },
    };
    sessionStorage.setItem(
      'talkytown.pending.v2:["adult","profile","session"]',
      JSON.stringify(original),
    );
    expect(readPending(sessionStorage, "adult", "profile", "session")?.kind).toBe("expired");
    expect(Object.values(sessionStorage).join("")).not.toContain("private pending fixture");
  });
  it("unavailable local packs leave typing enabled and never start remote recognition", async () => {
    FakeRecognition.status = "downloadable";
    render(<ConversationScreen profileId="profile" sessionId="session" />);
    await waitFor(() => expect(screen.getByLabelText("Tu mensaje en inglés")).toBeEnabled());
    expect(screen.getByRole("button", { name: "Usar micrófono" })).toBeDisabled();
    expect(FakeRecognition.instances.some((instance) => instance.starts)).toBe(false);
  });
});
