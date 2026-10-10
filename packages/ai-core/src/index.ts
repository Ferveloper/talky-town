import type { AgeBand, LearningLevel, PracticeMode, TurnRole } from "@talkytown/shared";
import type { AiConversationResponse } from "./ai-response.schema";
export * from "./ai-response.schema";
export * from "./ai-response.parser";
export * from "./provider-errors";
export * from "./conversation-prompt";
export * from "./openai-compatible.transport";
export * from "./openai-compatible.provider";
export type ConversationMessage = { role: TurnRole; content: string };
export type ConversationRequest = {
  ageBand: AgeBand;
  learningLevel: LearningLevel;
  mode: PracticeMode;
  message: string;
  missionPrompt?: string;
  missionObjective?: string;
  avatar?: { name: string; personality: string };
  previousTurns?: ConversationMessage[];
};
export type AiProviderStatus = { available: boolean; providerId: string; detail?: string };
export interface AiProvider {
  id: string;
  name: string;
  checkStatus?(): Promise<AiProviderStatus>;
  generateConversationReply(input: ConversationRequest): Promise<AiConversationResponse>;
}
export class MockAiProvider implements AiProvider {
  id = "mock";
  name = "Mock Provider";
  async checkStatus(): Promise<AiProviderStatus> {
    return { available: true, providerId: this.id, detail: "Mock requires no API keys." };
  }
  async generateConversationReply(input: ConversationRequest): Promise<AiConversationResponse> {
    if (/\b(address|phone|full name|school name|where do you live)\b/i.test(input.message)) {
      return {
        reply: "Let's talk about something fun and safe.",
        newVocabulary: [],
        avatarEmotion: "encouraging",
        safety: { flagged: true, reason: "personal-data-request" },
      };
    }
    const needed = /\bI likes\b/i.test(input.message);
    const correction = needed
      ? {
          needed: true as const,
          original: input.message,
          corrected: input.message.replace(/\bI likes\b/i, "I like"),
          explanation: input.ageBand === "5-7" ? 'Say "I like".' : 'Use "like" with "I".',
        }
      : { needed: false as const };
    const prompt =
      input.missionPrompt ??
      (input.learningLevel === "hero" ? "Why do you like that topic?" : "What animal do you like?");
    return {
      reply: input.ageBand === "5-7" ? `Great job! ${prompt}` : `Nice practice! ${prompt}`,
      correction,
      newVocabulary: [],
      avatarEmotion: needed ? "thinking" : "encouraging",
      safety: { flagged: false },
    };
  }
}
export function createMockAiProvider(): AiProvider {
  return new MockAiProvider();
}
