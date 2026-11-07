"use client";
import { Mic, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { useSpeechInput } from "./use-speech-input";
export function MicrophoneControl({
  input,
  disabled,
  discard,
}: {
  input: ReturnType<typeof useSpeechInput>;
  disabled: boolean;
  discard: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    setSeconds(0);
    if (input.phase !== "listening") return;
    const timer = setInterval(() => setSeconds((value) => Math.min(30, value + 1)), 1000);
    return () => clearInterval(timer);
  }, [input.phase]);
  return (
    <div className="speech-input">
      <div className="speech-actions">
        <label htmlFor="voice-language">Idioma del micrófono</label>
        <select
          id="voice-language"
          value={input.language}
          disabled={disabled || input.busy}
          onChange={(event) => input.setLanguage(event.target.value as "en-US" | "es-ES")}
        >
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español</option>
        </select>
        {input.busy ? (
          <>
            <button
              type="button"
              className="talky-button secondary"
              onClick={input.stop}
              disabled={input.phase !== "listening"}
            >
              <Square size={18} aria-hidden /> Parar y revisar
            </button>
            <button type="button" className="talky-button secondary" onClick={discard}>
              <X size={18} aria-hidden /> Descartar voz
            </button>
          </>
        ) : (
          <button
            type="button"
            className="talky-button secondary"
            disabled={disabled || !input.available}
            onClick={input.start}
          >
            <Mic size={18} aria-hidden /> Usar micrófono
          </button>
        )}
      </div>
      <p
        className={input.phase === "listening" ? "recording-indicator" : "speech-notice"}
        role="status"
      >
        {input.phase === "listening"
          ? `Escuchando · ${seconds}/30 s`
          : input.phase === "requesting-permission"
            ? "Abriendo el micrófono…"
            : ["stopping", "transcribing"].includes(input.phase)
              ? "Preparando la transcripción…"
              : input.notice}
      </p>
      {!input.available && !input.busy && (
        <button type="button" className="text-button" onClick={input.refresh}>
          Comprobar voz de nuevo
        </button>
      )}
      {input.error && <p role="alert">{input.error} No pasa nada, puedes escribir tu respuesta.</p>}
    </div>
  );
}
