export type RecognitionLanguage = "en-US" | "es-ES";
export type RecognitionMode = "local-only" | "browser-service";
export type InputPhase =
  | "idle"
  | "requesting-permission"
  | "listening"
  | "stopping"
  | "transcribing"
  | "transcript-ready"
  | "cancelled"
  | "failed";
export type OutputPhase =
  | "loading-voices"
  | "idle"
  | "preparing"
  | "speaking"
  | "ended"
  | "stopped"
  | "failed";
export type Capability = { available: boolean; reason: string };
export interface NativeRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  processLocally?: boolean;
  onstart: (() => void) | null;
  onaudiostart: (() => void) | null;
  onresult:
    | ((event: {
        resultIndex: number;
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
export interface RecognitionConstructor {
  new (): NativeRecognition;
  available?(options: { langs: string[]; processLocally: true }): Promise<string>;
}
export interface RecognitionCallbacks {
  phase(phase: InputPhase): void;
  transcript(text: string): void;
  error(message: string): void;
}
export interface SpeechInputAdapter {
  start(): void;
  stop(): void;
  abort(): void;
  dispose(): void;
}
export interface SpeechOutputAdapter {
  speak(text: string, voice: SpeechSynthesisVoice): void;
  cancel(): void;
  dispose(): void;
}
export const CAPTURE_MS = 30_000;
export const STARTUP_MS = 15_000;
export const FINALIZE_MS = 5_000;
