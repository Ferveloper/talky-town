import { recognitionConstructor } from "./capabilities";
import { claimSpeech } from "./coordinator";
import {
  CAPTURE_MS,
  FINALIZE_MS,
  STARTUP_MS,
  type NativeRecognition,
  type RecognitionCallbacks,
  type RecognitionLanguage,
  type RecognitionMode,
  type SpeechInputAdapter,
} from "./contracts";
export class BrowserRecognition implements SpeechInputAdapter {
  private engine?: NativeRecognition;
  private generation = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private release?: () => void;
  private stopping = false;
  constructor(
    private mode: RecognitionMode,
    private language: RecognitionLanguage,
    private callbacks: RecognitionCallbacks,
  ) {}
  start() {
    this.dispose();
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      this.fail("Este navegador no reconoce voz. Puedes escribir.");
      return;
    }
    const generation = ++this.generation;
    const current = () => this.generation === generation;
    const final = new Map<number, string>();
    let started = false;
    try {
      const engine = new Constructor();
      // Availability was precomputed before the user gesture. Recheck the API synchronously.
      if (this.mode === "local-only" && (!Constructor.available || !("processLocally" in engine))) {
        this.fail("La voz local no está disponible. Puedes escribir.");
        return;
      }
      engine.lang = this.language;
      engine.continuous = false;
      engine.interimResults = false;
      engine.maxAlternatives = 1;
      if (this.mode === "local-only") {
        engine.processLocally = true;
        if (engine.processLocally !== true) {
          this.fail("La voz local no está disponible. Puedes escribir.");
          return;
        }
      }
      this.engine = engine;
      this.release = claimSpeech(() => this.abort());
      this.callbacks.phase("requesting-permission");
      const startup = setTimeout(() => {
        if (current() && !started)
          this.fail("El micrófono no empezó a tiempo. Puedes escribir o intentarlo de nuevo.");
      }, STARTUP_MS);
      this.timers.push(startup);
      const begin = () => {
        if (!current() || started) return;
        started = true;
        clearTimeout(startup);
        this.callbacks.phase("listening");
        this.timers.push(
          setTimeout(() => {
            if (current()) this.stop();
          }, CAPTURE_MS),
        );
      };
      engine.onstart = begin;
      engine.onaudiostart = begin;
      engine.onresult = (event) => {
        if (!current()) return;
        for (let index = event.resultIndex; index < event.results.length; index++) {
          const result = event.results[index];
          if (result?.isFinal) final.set(index, result[0].transcript);
        }
        if ([...final.values()].join(" ").length > 2000)
          this.fail("Prueba una frase más corta. Puedes escribirla.");
      };
      engine.onerror = (event) => {
        if (!current()) return;
        const message = ["not-allowed", "service-not-allowed"].includes(event.error)
          ? "El micrófono no tiene permiso. Pide ayuda a un adulto o sigue escribiendo."
          : event.error === "no-speech"
            ? "No se oyó una frase. Puedes intentarlo de nuevo o escribir."
            : "No pudimos reconocer la voz. Puedes escribir o intentarlo de nuevo.";
        this.fail(message);
      };
      engine.onend = () => {
        if (!current()) return;
        const text = [...final.entries()]
          .sort(([a], [b]) => a - b)
          .map(([, value]) => value)
          .join(" ")
          .trim();
        this.dispose();
        if (!text) {
          this.callbacks.error("No se oyó una frase. Puedes intentarlo de nuevo o escribir.");
          this.callbacks.phase("failed");
          return;
        }
        this.callbacks.transcript(text);
        this.callbacks.phase("transcript-ready");
      };
      engine.start(); // No await: remains inside the actual click handler.
    } catch {
      this.fail("No pudimos abrir el micrófono. Puedes seguir escribiendo.");
    }
  }
  stop() {
    if (!this.engine || this.stopping) return;
    this.stopping = true;
    this.callbacks.phase("stopping");
    try {
      this.engine.stop();
      if (!this.engine) return; // Some implementations finish synchronously.
      this.callbacks.phase("transcribing");
      this.timers.push(
        setTimeout(
          () =>
            this.fail("La transcripción tardó demasiado. Puedes escribir o intentarlo de nuevo."),
          FINALIZE_MS,
        ),
      );
    } catch {
      this.fail("No pudimos terminar la transcripción. Puedes escribir.");
    }
  }
  private fail(message: string) {
    this.dispose();
    this.callbacks.error(message);
    this.callbacks.phase("failed");
  }
  abort() {
    this.dispose();
    this.callbacks.phase("cancelled");
  }
  dispose() {
    this.generation++;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers = [];
    const engine = this.engine;
    this.engine = undefined;
    this.stopping = false;
    if (engine) {
      engine.onstart = engine.onaudiostart = engine.onend = null;
      engine.onresult = engine.onerror = null;
      try {
        engine.abort();
      } catch {
        /* Already ended. */
      }
    }
    this.release?.();
    this.release = undefined;
  }
}
