// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { recognitionCapability } from "../lib/speech/capabilities";
import { BrowserRecognition } from "../lib/speech/browser-recognition";
import { BrowserSynthesis } from "../lib/speech/browser-synthesis";
import { selectVoice } from "../lib/speech/voice-selection";
import { useSpeechInput } from "../components/conversation/use-speech-input";
import { useSpeechOutput } from "../components/conversation/use-speech-output";
import { CAPTURE_MS, FINALIZE_MS, STARTUP_MS } from "../lib/speech/contracts";
import {
  FakeRecognition,
  installRecognition,
  installSynthesis,
  localVoices,
  runningRecognition,
} from "./speech-fakes";
beforeEach(() => {
  installRecognition();
  installSynthesis();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "SpeechRecognition");
  Reflect.deleteProperty(window, "speechSynthesis");
  Reflect.deleteProperty(globalThis, "SpeechSynthesisUtterance");
});
function recognition() {
  const callbacks = { phase: vi.fn(), transcript: vi.fn(), error: vi.fn() };
  const adapter = new BrowserRecognition("local-only", "en-US", callbacks);
  return { adapter, callbacks };
}
describe("fail-closed recognition capabilities", () => {
  it("does not start or download anything during available checks", async () => {
    const check = vi.spyOn(FakeRecognition, "available");
    expect((await recognitionCapability("local-only", "es-ES")).available).toBe(true);
    expect(check).toHaveBeenCalledWith({ langs: ["es-ES"], processLocally: true });
    expect(FakeRecognition.instances.every((instance) => !instance.starts)).toBe(true);
  });
  it.each(["downloadable", "downloading", "unavailable"])(
    "rejects %s without remote fallback",
    async (status) => {
      FakeRecognition.status = status;
      expect((await recognitionCapability("local-only", "en-US")).available).toBe(false);
    },
  );
  it("fails closed on policy rejection and absent available API", async () => {
    FakeRecognition.denied = true;
    expect((await recognitionCapability("local-only", "en-US")).available).toBe(false);
    const original = FakeRecognition.available;
    Reflect.deleteProperty(FakeRecognition, "available");
    expect((await recognitionCapability("local-only", "en-US")).available).toBe(false);
    FakeRecognition.available = original;
  });
  it("does not treat an assignable processLocally expando as support", async () => {
    class Unsupported extends FakeRecognition {
      constructor() {
        super();
        Reflect.deleteProperty(this, "processLocally");
      }
    }
    Object.defineProperty(window, "SpeechRecognition", { value: Unsupported, configurable: true });
    expect((await recognitionCapability("local-only", "en-US")).available).toBe(false);
  });
  it("unsupported recognition leaves a controlled text fallback", async () => {
    Reflect.deleteProperty(window, "SpeechRecognition");
    expect((await recognitionCapability("browser-service", "en-US")).available).toBe(false);
  });
});
describe("recognition lifecycle", () => {
  it("starts synchronously, uses explicit language, ignores interim and deduplicates final results", () => {
    const { adapter, callbacks } = recognition();
    adapter.start();
    const engine = runningRecognition();
    expect(engine.starts).toBe(1);
    expect(engine.processLocally).toBe(true);
    expect(engine.lang).toBe("en-US");
    engine.onstart?.();
    engine.result("interim", false);
    expect(callbacks.transcript).not.toHaveBeenCalled();
    engine.result("dog");
    engine.result("dog");
    engine.onend?.();
    expect(callbacks.transcript).toHaveBeenCalledTimes(1);
    expect(callbacks.transcript).toHaveBeenCalledWith("dog");
    expect(engine.aborts).toBe(1);
  });
  it("silence fails without creating a transcript", () => {
    const { adapter, callbacks } = recognition();
    adapter.start();
    runningRecognition().onend?.();
    expect(callbacks.transcript).not.toHaveBeenCalled();
    expect(callbacks.phase).toHaveBeenLastCalledWith("failed");
  });
  it("handles permission denial without restarting", () => {
    const { adapter, callbacks } = recognition();
    adapter.start();
    runningRecognition().onerror?.({ error: "not-allowed" });
    expect(callbacks.error).toHaveBeenCalledWith(expect.stringContaining("permiso"));
    expect(runningRecognition().starts).toBe(1);
  });
  it("bounds startup and captures for at most 30 seconds with a bounded finalization", () => {
    vi.useFakeTimers();
    const { adapter, callbacks } = recognition();
    adapter.start();
    vi.advanceTimersByTime(STARTUP_MS);
    expect(callbacks.phase).toHaveBeenLastCalledWith("failed");
    adapter.start();
    const engine = runningRecognition();
    engine.onstart?.();
    vi.advanceTimersByTime(CAPTURE_MS);
    expect(engine.stops).toBe(1);
    expect(callbacks.phase).toHaveBeenLastCalledWith("transcribing");
    vi.advanceTimersByTime(FINALIZE_MS);
    expect(callbacks.phase).toHaveBeenLastCalledWith("failed");
    expect(engine.starts).toBe(1);
  });
  it("Stop finalizes once, Discard suppresses saved late callbacks", () => {
    const { adapter, callbacks } = recognition();
    adapter.start();
    const engine = runningRecognition();
    const late = engine.onresult!;
    const ended = engine.onend!;
    engine.onstart?.();
    adapter.stop();
    adapter.stop();
    expect(engine.stops).toBe(1);
    adapter.abort();
    late({ resultIndex: 0, results: [{ isFinal: true, 0: { transcript: "late" } }] });
    ended();
    expect(callbacks.transcript).not.toHaveBeenCalled();
  });
  it("hook refuses missing packs until an explicit processing-mode selection", async () => {
    FakeRecognition.status = "downloadable";
    const draft = vi.fn();
    const { result, rerender } = renderHook(({ mode }) => useSpeechInput(mode, true, draft), {
      initialProps: { mode: "local-only" as "local-only" | "browser-service" },
    });
    await waitFor(() => expect(result.current.notice).toContain("no está disponible"));
    act(() => result.current.start());
    expect(FakeRecognition.instances.some((value) => value.starts)).toBe(false);
    rerender({ mode: "browser-service" });
    await waitFor(() => expect(result.current.available).toBe(true));
    act(() => result.current.start());
    expect(runningRecognition().processLocally).toBe(false);
  });
  it("unmount, hiding and logout invalidate native callbacks and clear memory drafts", async () => {
    const draft = vi.fn();
    const { result, unmount } = renderHook(() => useSpeechInput("local-only", true, draft));
    await waitFor(() => expect(result.current.available).toBe(true));
    act(() => result.current.start());
    const engine = runningRecognition();
    const late = engine.onend!;
    act(() => window.dispatchEvent(new Event("talkytown:session-cleared")));
    expect(engine.aborts).toBe(1);
    expect(draft).toHaveBeenLastCalledWith("");
    unmount();
    late();
    expect(draft).not.toHaveBeenCalledWith(expect.stringContaining("dog"));
  });
  it("tab hiding aborts capture and clears an unconfirmed draft", async () => {
    const draft = vi.fn();
    const { result } = renderHook(() => useSpeechInput("local-only", true, draft));
    await waitFor(() => expect(result.current.available).toBe(true));
    act(() => result.current.start());
    const engine = runningRecognition();
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(engine.aborts).toBe(1);
    expect(draft).toHaveBeenLastCalledWith("");
    Reflect.deleteProperty(document, "hidden");
  });
  it("an unresolved availability probe expires without starting a microphone", async () => {
    vi.useFakeTimers();
    vi.spyOn(FakeRecognition, "available").mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useSpeechInput("local-only", true, vi.fn()));
    await act(async () => vi.advanceTimersByTime(5000));
    expect(result.current.available).toBe(false);
    act(() => result.current.start());
    expect(FakeRecognition.instances.some((instance) => instance.starts)).toBe(false);
  });
});
describe("local bilingual synthesis", () => {
  it("selects stable distinct avatar voices and never falls back from Spanish to English/remote", () => {
    expect(selectVoice([...localVoices].reverse(), "en", "luna")?.voiceURI).toBe("en-a");
    expect(selectVoice(localVoices, "en", "max")?.voiceURI).toBe("en-b");
    expect(selectVoice(localVoices, "es", "max")?.lang).toBe("es-ES");
    expect(selectVoice(localVoices.slice(0, 2), "es", "luna")).toBeUndefined();
    expect(
      selectVoice(
        localVoices.map((voice) => ({ ...voice, localService: false })),
        "en",
        "luna",
      ),
    ).toBeUndefined();
  });
  it("speaking follows onstart; Stop and new playback suppress stale events", () => {
    const synthesis = installSynthesis();
    const state = vi.fn();
    const adapter = new BrowserSynthesis(state);
    adapter.speak("Hello!", localVoices[0]!);
    const first = synthesis.utterances[0]!;
    expect(state).toHaveBeenLastCalledWith("preparing");
    const late = first.onend!;
    first.onstart?.();
    expect(state).toHaveBeenLastCalledWith("speaking");
    adapter.speak("Dog.", localVoices[1]!);
    late();
    expect(state).toHaveBeenLastCalledWith("preparing");
    adapter.cancel();
    expect(state).toHaveBeenLastCalledWith("stopped");
    expect(synthesis.cancellations).toBe(2);
  });
  it("microphone activation interrupts audio before recognition starts", () => {
    const synthesis = installSynthesis();
    const output = new BrowserSynthesis(vi.fn());
    output.speak("Hello!", localVoices[0]!);
    const { adapter } = recognition();
    adapter.start();
    expect(synthesis.cancellations).toBe(1);
    adapter.dispose();
  });
  it("handles asynchronous voiceschanged and cleans up playback on unmount", async () => {
    const synthesis = installSynthesis([]);
    const { result, unmount } = renderHook(() => useSpeechOutput("luna"));
    const turn = {
      id: "a",
      role: "avatar",
      content: "Hello!",
    } as import("@talkytown/shared").TurnResponse;
    expect(result.current.voiceFor(turn)).toBeUndefined();
    synthesis.getVoices = () => localVoices;
    act(() => synthesis.dispatchEvent(new Event("voiceschanged")));
    expect(result.current.voiceFor(turn)?.lang).toBe("en-US");
    act(() => result.current.play(turn));
    unmount();
    expect(synthesis.cancellations).toBe(1);
  });
  it("tab hiding and auth-session clearing stop actual playback", () => {
    const synthesis = installSynthesis();
    const { result } = renderHook(() => useSpeechOutput("luna"));
    const turn = {
      id: "a",
      role: "avatar",
      content: "Hello!",
    } as import("@talkytown/shared").TurnResponse;
    act(() => result.current.play(turn));
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(synthesis.cancellations).toBe(1);
    Reflect.deleteProperty(document, "hidden");
    act(() => result.current.play(turn));
    act(() => window.dispatchEvent(new Event("talkytown:session-cleared")));
    expect(synthesis.cancellations).toBe(2);
  });
  it("never speaks a child turn and fails a stalled playback without a speaking claim", () => {
    vi.useFakeTimers();
    const synthesis = installSynthesis();
    const { result } = renderHook(() => useSpeechOutput("luna"));
    const child = {
      id: "a",
      role: "child",
      content: "dog",
    } as import("@talkytown/shared").TurnResponse;
    act(() => result.current.play(child));
    expect(synthesis.utterances).toHaveLength(0);
    act(() => result.current.play({ ...child, role: "avatar" }));
    expect(result.current.phase).toBe("preparing");
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current.phase).toBe("failed");
    expect(synthesis.cancellations).toBe(1);
  });
});
