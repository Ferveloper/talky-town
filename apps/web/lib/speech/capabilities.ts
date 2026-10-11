import type {
  Capability,
  RecognitionConstructor,
  RecognitionLanguage,
  RecognitionMode,
} from "./contracts";
export function recognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const browser = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return browser.SpeechRecognition || browser.webkitSpeechRecognition;
}
/** Read-only checks: never start a microphone, install a pack or change mode. */
export async function recognitionCapability(
  mode: RecognitionMode,
  language: RecognitionLanguage,
): Promise<Capability> {
  const Constructor = recognitionConstructor();
  if (!Constructor)
    return { available: false, reason: "Este navegador no reconoce voz. Puedes escribir." };
  if (mode === "browser-service")
    return {
      available: true,
      reason: "Servicio del navegador elegido por un adulto; el audio puede salir del dispositivo.",
    };
  const unavailable = {
    available: false,
    reason:
      "La voz local no está disponible para este idioma. Puedes escribir o pedir a un adulto que revise las opciones de voz.",
  };
  try {
    if (!Constructor.available || !("processLocally" in new Constructor())) return unavailable;
    const status = await Constructor.available({ langs: [language], processLocally: true });
    return status === "available"
      ? { available: true, reason: "Reconocimiento local: idioma instalado." }
      : unavailable;
  } catch {
    return unavailable; // Includes Permissions-Policy denial; never retry remotely.
  }
}
