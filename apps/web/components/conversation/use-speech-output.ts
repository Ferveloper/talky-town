"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { TurnResponse } from "@talkytown/shared";
import { safetyResponseLocale } from "@talkytown/shared";
import { BrowserSynthesis } from "@/lib/speech/browser-synthesis";
import { selectVoice } from "@/lib/speech/voice-selection";
import type { OutputPhase } from "@/lib/speech/contracts";
export function useSpeechOutput(avatar: string) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [phase, setPhase] = useState<OutputPhase>("loading-voices");
  const [turnId, setTurnId] = useState<string>();
  const adapter = useRef<BrowserSynthesis>();
  const cancel = useCallback(() => {
    adapter.current?.cancel();
    setTurnId(undefined);
  }, []);
  useEffect(() => {
    adapter.current = new BrowserSynthesis(setPhase);
    const synthesis = window.speechSynthesis;
    if (!synthesis) {
      setPhase("idle");
      return () => adapter.current?.dispose();
    }
    const load = () => {
      try {
        setVoices(synthesis.getVoices());
      } catch {
        setVoices([]);
      }
      setPhase((old) => (old === "loading-voices" ? "idle" : old));
    };
    const visibility = () => {
      if (document.hidden) cancel();
    };
    const timer = setTimeout(load, 3000);
    load();
    synthesis.addEventListener("voiceschanged", load);
    window.addEventListener("talkytown:session-cleared", cancel);
    window.addEventListener("pagehide", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimeout(timer);
      adapter.current?.dispose();
      synthesis.removeEventListener("voiceschanged", load);
      window.removeEventListener("talkytown:session-cleared", cancel);
      window.removeEventListener("pagehide", cancel);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [cancel]);
  function voiceFor(turn: TurnResponse) {
    return selectVoice(voices, safetyResponseLocale(turn.content) || "en", avatar);
  }
  function play(turn: TurnResponse) {
    if (turn.role !== "avatar" || document.hidden) return;
    const voice = voiceFor(turn);
    if (!voice) return;
    setTurnId(turn.id);
    adapter.current?.speak(turn.content, voice);
  }
  return { phase, turnId, play, cancel, voiceFor };
}
