import { claimSpeech } from "./coordinator";
import type { OutputPhase, SpeechOutputAdapter } from "./contracts";
export class BrowserSynthesis implements SpeechOutputAdapter {
  private generation = 0;
  private utterance?: SpeechSynthesisUtterance;
  private timer?: ReturnType<typeof setTimeout>;
  private release?: () => void;
  constructor(private state: (phase: OutputPhase) => void) {}
  speak(text: string, voice: SpeechSynthesisVoice) {
    this.dispose();
    if (!text.trim() || text.length > 2000 || !voice.localService) {
      this.state("failed");
      return;
    }
    const generation = ++this.generation;
    const current = () => generation === this.generation;
    try {
      this.release = claimSpeech(() => this.cancel());
      const utterance = new SpeechSynthesisUtterance(text);
      this.utterance = utterance;
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 0.9;
      this.state("preparing");
      const timeout = () => {
        if (current()) {
          this.dispose();
          this.state("failed");
        }
      };
      this.timer = setTimeout(timeout, 5000);
      utterance.onstart = () => {
        if (!current()) return;
        clearTimeout(this.timer);
        this.timer = setTimeout(timeout, 180_000);
        this.state("speaking");
      };
      utterance.onend = () => {
        if (current()) {
          this.dispose();
          this.state("ended");
        }
      };
      utterance.onerror = () => {
        if (current()) {
          this.dispose();
          this.state("failed");
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch {
      this.dispose();
      this.state("failed");
    }
  }
  cancel() {
    this.dispose();
    this.state("stopped");
  }
  dispose() {
    this.generation++;
    clearTimeout(this.timer);
    if (this.utterance) {
      this.utterance.onstart = this.utterance.onend = this.utterance.onerror = null;
      this.utterance = undefined;
      try {
        window.speechSynthesis.cancel();
      } catch {
        /* Browser unavailable. */
      }
    }
    this.release?.();
    this.release = undefined;
  }
}
