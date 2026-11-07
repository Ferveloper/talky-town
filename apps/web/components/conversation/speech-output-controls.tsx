"use client";
import { useState } from "react";
import { Volume2, Square } from "lucide-react";
import type { TurnResponse } from "@talkytown/shared";
import type { useSpeechOutput } from "./use-speech-output";
export function SpeechOutputControls({
  turn,
  output,
  disabled,
}: {
  turn: TurnResponse;
  output: ReturnType<typeof useSpeechOutput>;
  disabled: boolean;
}) {
  const [played, setPlayed] = useState(false);
  const active = output.turnId === turn.id && ["preparing", "speaking"].includes(output.phase);
  const voice = output.voiceFor(turn);
  return (
    <div className="speech-output">
      <button
        type="button"
        className="speech-button"
        disabled={disabled || !voice}
        onClick={() => {
          output.play(turn);
          setPlayed(true);
        }}
        aria-label={`${played ? "Volver a escuchar" : "Escuchar"} respuesta`}
      >
        <Volume2 size={18} aria-hidden />
        {played ? "Volver a escuchar" : "Escuchar"}
      </button>
      {active && (
        <button type="button" className="speech-button" onClick={output.cancel}>
          <Square size={18} aria-hidden /> Detener voz
        </button>
      )}
      {!voice && (
        <small>
          El navegador no ofrece una voz local para este idioma. Puedes leer la respuesta.
        </small>
      )}
      {output.turnId === turn.id && output.phase === "failed" && (
        <small role="status">
          No pudimos reproducir la voz. Puedes leer o intentarlo de nuevo.
        </small>
      )}
    </div>
  );
}
