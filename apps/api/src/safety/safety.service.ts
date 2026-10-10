import { Injectable } from "@nestjs/common";
import type { AiConversationResponse } from "@talkytown/ai-core";
import { screenText, type SafetyDecision } from "./safety-rules";
@Injectable()
export class SafetyService {
  screen(text: string): SafetyDecision {
    return screenText(text);
  }
  screenOutput(output: AiConversationResponse): SafetyDecision {
    for (const text of [
      output.reply,
      output.correction?.needed ? output.correction.original : undefined,
      output.correction?.needed ? output.correction.corrected : undefined,
      output.correction?.needed ? output.correction.explanation : undefined,
      ...output.newVocabulary,
    ]) {
      if (text) {
        const decision = this.screen(text);
        if (decision.flagged) return decision;
      }
    }
    return output.safety.flagged
      ? { flagged: true, reason: "provider-safety-flag", category: "provider-output" }
      : { flagged: false };
  }
}
