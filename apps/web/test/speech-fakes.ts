import type { NativeRecognition } from "../lib/speech/contracts";
export class FakeRecognition implements NativeRecognition {
  static instances: FakeRecognition[] = [];
  static status = "available";
  static denied = false;
  static available = async (_options: { langs: string[]; processLocally: true }) => {
    if (FakeRecognition.denied) throw new Error("Permissions-Policy");
    return FakeRecognition.status;
  };
  processLocally = false;
  lang = "";
  continuous = false;
  interimResults = false;
  maxAlternatives = 1;
  onstart: NativeRecognition["onstart"] = null;
  onaudiostart: NativeRecognition["onaudiostart"] = null;
  onend: NativeRecognition["onend"] = null;
  onerror: NativeRecognition["onerror"] = null;
  onresult: NativeRecognition["onresult"] = null;
  starts = 0;
  stops = 0;
  aborts = 0;
  constructor() {
    FakeRecognition.instances.push(this);
  }
  start() {
    this.starts++;
  }
  stop() {
    this.stops++;
  }
  abort() {
    this.aborts++;
  }
  result(text: string, isFinal = true) {
    this.onresult?.({ resultIndex: 0, results: [{ isFinal, 0: { transcript: text } }] });
  }
}
export function installRecognition() {
  FakeRecognition.instances = [];
  FakeRecognition.status = "available";
  FakeRecognition.denied = false;
  Object.defineProperty(window, "SpeechRecognition", {
    value: FakeRecognition,
    configurable: true,
  });
}
export function runningRecognition() {
  return [...FakeRecognition.instances].reverse().find((instance) => instance.starts > 0)!;
}
export const localVoices = [
  { voiceURI: "en-a", name: "English A", lang: "en-US", localService: true, default: true },
  { voiceURI: "en-b", name: "English B", lang: "en-US", localService: true, default: false },
  { voiceURI: "es-a", name: "Español", lang: "es-ES", localService: true, default: false },
] as SpeechSynthesisVoice[];
export class FakeUtterance {
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  voice?: SpeechSynthesisVoice;
  lang = "";
  rate = 1;
  constructor(public text: string) {}
}
export function installSynthesis(voices = localVoices) {
  const synthesis = new EventTarget() as EventTarget & {
    getVoices: () => SpeechSynthesisVoice[];
    speak: (utterance: FakeUtterance) => void;
    cancel: () => void;
    utterances: FakeUtterance[];
    cancellations: number;
  };
  synthesis.utterances = [];
  synthesis.cancellations = 0;
  synthesis.getVoices = () => voices;
  synthesis.speak = (utterance) => synthesis.utterances.push(utterance);
  synthesis.cancel = () => {
    synthesis.cancellations++;
  };
  Object.defineProperty(window, "speechSynthesis", { value: synthesis, configurable: true });
  Object.defineProperty(globalThis, "SpeechSynthesisUtterance", {
    value: FakeUtterance,
    configurable: true,
  });
  return synthesis;
}
