"use client";
import { useAdult } from "@/components/layout/app-shell";
import { TalkyCard } from "@/components/ui/talky";
export function VoicePreferences() {
  const { recognitionMode, setRecognitionMode } = useAdult();
  return (
    <TalkyCard>
      <h2>Voz en esta demostración</h2>
      <p>
        Solo local usa un idioma ya instalado cuando el navegador permite verificarlo. Si no está
        disponible, se puede escribir.
      </p>
      <p>
        El servicio de voz del navegador puede enviar audio del micrófono al proveedor del
        navegador. Esta elección informada para la demo no acredita consentimiento parental legal.
        Usa frases ficticias y no compartas datos personales.
      </p>
      <fieldset className="voice-preferences">
        <legend>Procesamiento elegido por un adulto</legend>
        <label>
          <input
            type="radio"
            name="speech-mode"
            checked={recognitionMode !== "browser-service"}
            onChange={() => setRecognitionMode("local-only")}
          />{" "}
          Solo local (predeterminado)
        </label>
        <label>
          <input
            type="radio"
            name="speech-mode"
            checked={recognitionMode === "browser-service"}
            onChange={() => setRecognitionMode("browser-service")}
          />{" "}
          Permitir servicio del navegador; el audio puede salir del dispositivo
        </label>
      </fieldset>
      <p>
        La elección vive solo en memoria en esta pestaña. Se borra al recargar, salir o cambiar de
        identidad. No activa el micrófono ni descarga idiomas.
      </p>
    </TalkyCard>
  );
}
