import type {
  AgeBand,
  AvatarEmotion,
  LearningLevel,
  PracticeMode,
  TurnRole,
} from "@talkytown/shared";
export type ConversationMessage = { role: TurnRole; content: string };
export type ConversationRequest = {
  ageBand: AgeBand;
  learningLevel: LearningLevel;
  mode: PracticeMode;
  message: string;
  missionPrompt?: string;
  previousTurns?: ConversationMessage[];
};
export type AiConversationResponse = {
  reply: string;
  correction?: { needed: boolean; original?: string; corrected?: string; explanation?: string };
  newVocabulary: string[];
  avatarEmotion: AvatarEmotion;
  safety: { flagged: boolean; reason?: string };
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
          needed: true,
          original: input.message,
          corrected: input.message.replace(/\bI likes\b/i, "I like"),
          explanation: input.ageBand === "5-7" ? 'Say "I like".' : 'Use "like" with "I".',
        }
      : { needed: false };
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
