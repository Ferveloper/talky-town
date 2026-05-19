export type AvatarEmotion =
  | "happy"
  | "thinking"
  | "celebrating"
  | "encouraging";

export type ConversationRequest = {
  profileId: string;
  ageBand: "5-7" | "8-10" | "11-12";
  mode: "free-talk" | "guided-mission";
  message: string;
  missionId?: string;
};

export type ConversationResponse = {
  reply: string;
  correction?: {
    needed: boolean;
    original?: string;
    corrected?: string;
    explanation?: string;
  };
  xp: number;
  newVocabulary: string[];
  missionProgress?: number;
  avatarEmotion: AvatarEmotion;
  safety: {
    flagged: boolean;
    reason?: string;
  };
};

export interface AiProvider {
  id: string;
  name: string;
  generateConversationReply(
    input: ConversationRequest,
  ): Promise<ConversationResponse>;
}

export class MockAiProvider implements AiProvider {
  id = "mock";
  name = "Mock Provider";

  async generateConversationReply(
    input: ConversationRequest,
  ): Promise<ConversationResponse> {
    return {
      reply: `Great job! You said: "${input.message}". Let's keep practicing.`,
      correction: {
        needed: false,
      },
      xp: 5,
      newVocabulary: [],
      missionProgress: input.mode === "guided-mission" ? 25 : undefined,
      avatarEmotion: "encouraging",
      safety: {
        flagged: false,
      },
    };
  }
}
