"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { recognitionCapability } from "@/lib/speech/capabilities";
import { BrowserRecognition } from "@/lib/speech/browser-recognition";
import type {
  Capability,
  InputPhase,
  RecognitionLanguage,
  RecognitionMode,
} from "@/lib/speech/contracts";
export function useSpeechInput(
  mode: RecognitionMode,
  enabled: boolean,
  onTranscript: (text: string) => void,
) {
  const [language, setLanguage] = useState<RecognitionLanguage>("en-US");
  const [phase, setPhase] = useState<InputPhase>("idle");
  const [error, setError] = useState("");
  const [check, setCheck] = useState(0);
  const [capability, setCapability] = useState<Capability & { key: string }>();
  const adapter = useRef<BrowserRecognition>();
  const latest = useRef(onTranscript);
  latest.current = onTranscript;
  const key = `${mode}:${language}:${check}`;
  const cancel = useCallback(() => {
    adapter.current?.dispose();
    adapter.current = undefined;
    setPhase("cancelled");
    setError("");
  }, []);
  useEffect(() => {
    let active = true;
    cancel();
    const timer = setTimeout(() => {
      if (active) {
        active = false;
        setCapability({
          key,
          available: false,
          reason: "No pudimos comprobar la voz local. Puedes escribir y volver a comprobarla.",
        });
      }
    }, 5000);
    void recognitionCapability(mode, language).then((result) => {
      if (active) {
        clearTimeout(timer);
        setCapability({ ...result, key });
      }
    });
    return () => {
      active = false;
      clearTimeout(timer);
      adapter.current?.dispose();
    };
  }, [key, mode, language, cancel]);
  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled, cancel]);
  useEffect(() => {
    const clear = () => {
      cancel();
      latest.current("");
    };
    const visibility = () => {
      if (document.hidden) clear();
      else setCheck((value) => value + 1);
    };
    window.addEventListener("talkytown:session-cleared", clear);
    window.addEventListener("pagehide", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      adapter.current?.dispose();
      window.removeEventListener("talkytown:session-cleared", clear);
      window.removeEventListener("pagehide", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [cancel]);
  const busy = ["requesting-permission", "listening", "stopping", "transcribing"].includes(phase);
  function start() {
    if (!enabled || busy || capability?.key !== key || !capability.available || document.hidden)
      return;
    setError("");
    adapter.current?.dispose();
    adapter.current = new BrowserRecognition(mode, language, {
      phase: setPhase,
      error: setError,
      transcript: (text) => latest.current(text),
    });
    adapter.current.start();
  }
  return {
    language,
    setLanguage,
    phase,
    busy,
    error,
    start,
    cancel,
    stop: () => adapter.current?.stop(),
    refresh: () => setCheck((value) => value + 1),
    available: capability?.key === key && capability.available,
    notice: capability?.key === key ? capability.reason : "Comprobando voz del navegador…",
  };
}
