import type { Page } from "@playwright/test";
export type SpeechHarness = {
  starts: { language: string; local: boolean }[];
  utterances: { text: string; language: string; voice: string }[];
  cancellations: number;
  aborts: number;
  begin(): void;
  result(text: string): void;
  error(code: string): void;
  late(): void;
  audioStart(): void;
  audioEnd(): void;
  removeSpanish(): void;
};
declare global {
  interface Window {
    speechTest: SpeechHarness;
  }
}
/** Fictional browser APIs only. Conversation, safety, rewards and PostgreSQL stay real. */
export async function installSpeech(
  page: Page,
  options: { unavailablePack?: boolean; unsupported?: boolean } = {},
) {
  await page.addInitScript((options) => {
    type Engine = {
      onstart: (() => void) | null;
      onend: (() => void) | null;
      onresult:
        | ((event: {
            resultIndex: number;
            results: { isFinal: boolean; 0: { transcript: string } }[];
          }) => void)
        | null;
      onerror: ((event: { error: string }) => void) | null;
    };
    let current: Engine | undefined;
    let lateEnd: (() => void) | null = null;
    let lateResult: Engine["onresult"] = null;
    let audio: { onstart: (() => void) | null; onend: (() => void) | null } | undefined;
    let voices = [
      {
        voiceURI: "local-en-a",
        name: "English A",
        lang: "en-US",
        localService: true,
        default: true,
      },
      {
        voiceURI: "local-en-b",
        name: "English B",
        lang: "en-US",
        localService: true,
        default: false,
      },
      { voiceURI: "local-es", name: "Español", lang: "es-ES", localService: true, default: false },
    ];
    const synthesis = new EventTarget();
    window.speechTest = {
      starts: [],
      utterances: [],
      cancellations: 0,
      aborts: 0,
      begin: () => current?.onstart?.(),
      result: (text) =>
        current?.onresult?.({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript: text } }],
        }),
      error: (error) => current?.onerror?.({ error }),
      late: () => {
        lateResult?.({
          resultIndex: 0,
          results: [{ isFinal: true, 0: { transcript: "old discarded draft" } }],
        });
        lateEnd?.();
      },
      audioStart: () => audio?.onstart?.(),
      audioEnd: () => audio?.onend?.(),
      removeSpanish: () => {
        voices = voices.filter((voice) => !voice.lang.startsWith("es"));
        synthesis.dispatchEvent(new Event("voiceschanged"));
      },
    };
    class Recognition {
      static available = async () => (options.unavailablePack ? "downloadable" : "available");
      processLocally = false;
      lang = "";
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onstart: Engine["onstart"] = null;
      onaudiostart = null;
      onend: Engine["onend"] = null;
      onresult: Engine["onresult"] = null;
      onerror: Engine["onerror"] = null;
      start() {
        current = {
          onstart: this.onstart,
          onend: this.onend,
          onresult: this.onresult,
          onerror: this.onerror,
        };
        lateEnd = this.onend;
        lateResult = this.onresult;
        window.speechTest.starts.push({ language: this.lang, local: this.processLocally });
      }
      stop() {
        this.onend?.();
      }
      abort() {
        window.speechTest.aborts++;
        current = undefined;
      }
    }
    Object.defineProperty(window, "SpeechRecognition", {
      configurable: true,
      value: options.unsupported ? undefined : Recognition,
    });
    Object.defineProperty(window, "webkitSpeechRecognition", {
      configurable: true,
      value: undefined,
    });
    class Utterance {
      voice?: { voiceURI: string };
      lang = "";
      rate = 1;
      onstart = null;
      onend = null;
      onerror = null;
      constructor(public text: string) {}
    }
    Object.assign(synthesis, {
      getVoices: () => voices,
      speak: (utterance: Utterance) => {
        audio = utterance;
        window.speechTest.utterances.push({
          text: utterance.text,
          language: utterance.lang,
          voice: utterance.voice?.voiceURI || "",
        });
      },
      cancel: () => {
        audio = undefined;
        window.speechTest.cancellations++;
      },
    });
    Object.defineProperty(window, "SpeechSynthesisUtterance", {
      configurable: true,
      value: Utterance,
    });
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: synthesis });
  }, options);
}
export async function recognize(page: Page, text: string) {
  await page.getByRole("button", { name: "Usar micrófono" }).click();
  await page.evaluate((text) => {
    window.speechTest.begin();
    window.speechTest.result(text);
  }, text);
  await page.getByRole("button", { name: "Parar y revisar" }).click();
}
