import type { AiConversationResponse } from "@talkytown/ai-core";
import type { InputMode } from "@talkytown/shared";
import type { FlaggedSafetyDecision } from "../safety/safety-rules";

/** Blocked variants cannot carry rejected child/provider content into persistence. */
export type PreparedOperation =
  | {
      kind: "accepted";
      snapshot: string;
      provider: string;
      message: string;
      inputMode: InputMode;
      output: AiConversationResponse;
    }
  | { kind: "blocked-input"; snapshot: string; decision: FlaggedSafetyDecision }
  | { kind: "blocked-output"; snapshot: string; provider: string; decision: FlaggedSafetyDecision };
