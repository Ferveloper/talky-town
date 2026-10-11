import { Injectable } from "@nestjs/common";
import type { AiConversationResponse } from "@talkytown/ai-core";
import {
  highestPriority,
  screenText,
  type SafetyContext,
  type SafetyDecision,
} from "./safety-rules";
import type { TurnResponse } from "@talkytown/shared";
import { fail } from "../common/api-error";
import { isSafetyResponse } from "./safety-responses";
@Injectable()
export class SafetyService {
  isStoredTurnSafe(
    turn: {
      role: string;
      content: string;
      correctedContent?: string | null;
      correctionExplanation?: string | null;
    },
    avatarName?: string,
  ): boolean {
    if (turn.role === "system") return false;
    const source = turn.role === "child" ? "child-input" : "provider-output";
    const contentSafe =
      (turn.role === "avatar" && isSafetyResponse(turn.content)) ||
      !this.screen(turn.content, { source, avatarName }).flagged;
    return (
      contentSafe &&
      [turn.correctedContent, turn.correctionExplanation].every(
        (text) => !text || !this.screen(text, { source: "provider-output", avatarName }).flagged,
      )
    );
  }
  /** HTTP response boundary only. Never call from internal snapshot/replay/transaction reads. */
  assertReturnedTurnsSafe(turns: TurnResponse[], avatarName?: string): void {
    if (
      turns.some(
        (turn) =>
          !this.isStoredTurnSafe(
            {
              role: turn.role,
              content: turn.content,
              // Legacy records may carry fields even when needed=false; mapper returns them.
              correctedContent: turn.correction.corrected,
              correctionExplanation: turn.correction.explanation,
            },
            avatarName,
          ),
      )
    )
      fail(409, "SAFETY_REVIEW_REQUIRED");
  }
  assertAliasSafeToReturn(alias: string): void {
    if (this.screen(alias, { source: "alias" }).flagged) fail(409, "SAFETY_REVIEW_REQUIRED");
  }
  screen(text: string, context: SafetyContext = { source: "child-input" }): SafetyDecision {
    return screenText(text, context);
  }
  screenOutput(output: AiConversationResponse, avatarName?: string): SafetyDecision {
    const context: SafetyContext = { source: "provider-output", avatarName };
    const decisions = [
      output.reply,
      output.correction?.needed ? output.correction.corrected : undefined,
      output.correction?.needed ? output.correction.explanation : undefined,
      ...output.newVocabulary,
      output.newVocabulary.join(" "),
    ]
      .filter((text): text is string => Boolean(text))
      .map((text) => this.screen(text, context));
    // Original represents child speech, not a provider question to the child.
    if (output.correction?.needed && output.correction.original)
      decisions.push(
        this.screen(output.correction.original, { source: "child-input", avatarName }),
      );
    const detected = highestPriority(decisions);
    if (detected.flagged) return detected;
    return output.safety.flagged
      ? {
          flagged: true,
          reason: "provider-safety-flag",
          category: "provider-output",
          severity: "warning",
          action: "redirect",
          template: "redirect",
        }
      : { flagged: false };
  }
}
