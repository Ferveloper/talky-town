import type { AgeBand, AvatarEmotion, PracticeMode } from "@talkytown/shared";

export type ConversationRequest = {
  profileId: string;
  ageBand: AgeBand;
  mode: PracticeMode;
  message: string;
  missionId?: string;
  previousTurns?: ConversationMessage[];
};

export type ConversationMessage = {
  role: "child" | "avatar" | "system";
  content: string;
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

export type AiProviderStatus = {
  available: boolean;
  providerId: string;
  detail?: string;
};

export interface AiProvider {
  id: string;
  name: string;
  checkStatus?(): Promise<AiProviderStatus>;
  generateConversationReply(input: ConversationRequest): Promise<ConversationResponse>;
}

const unsafePatterns = [
  /\baddress\b/i,
  /\bphone\b/i,
  /\bwhere do you live\b/i,
  /\bschool name\b/i,
  /\bfull name\b/i,
];

function buildCorrection(message: string): NonNullable<ConversationResponse["correction"]> {
  if (/\bI likes\b/i.test(message)) {
    return {
      needed: true,
      original: message,
      corrected: message.replace(/\bI likes\b/i, "I like"),
      explanation: 'Use "like" with "I".',
    };
  }

  return {
    needed: false,
  };
}

function buildReply(input: ConversationRequest): string {
  if (input.mode === "guided-mission") {
    return `Great mission answer. You said: "${input.message}". What can you add next?`;
  }

  if (input.ageBand === "5-7") {
    return `Great job. You said: "${input.message}".`;
  }

  return `Nice answer. You said: "${input.message}". Let's keep practicing in English.`;
}

export class MockAiProvider implements AiProvider {
  id = "mock";
  name = "Mock Provider";

  async checkStatus(): Promise<AiProviderStatus> {
    return {
      available: true,
      providerId: this.id,
      detail: "Mock provider is ready and does not require API keys.",
    };
  }

  async generateConversationReply(input: ConversationRequest): Promise<ConversationResponse> {
    const safetyHit = unsafePatterns.find((pattern) => pattern.test(input.message));

    if (safetyHit) {
      return {
        reply: "Let's talk about something fun and safe. How about animals, space or games?",
        correction: {
          needed: false,
        },
        xp: 0,
        newVocabulary: [],
        missionProgress: input.mode === "guided-mission" ? 0 : undefined,
        avatarEmotion: "encouraging",
        safety: {
          flagged: true,
          reason: "personal-data-request",
        },
      };
    }

    const correction = buildCorrection(input.message);

    return {
      reply: buildReply(input),
      correction,
      xp: correction.needed ? 10 : 5,
      newVocabulary: input.mode === "guided-mission" ? ["mission", "practice"] : ["practice"],
      missionProgress: input.mode === "guided-mission" ? 25 : undefined,
      avatarEmotion: correction.needed ? "thinking" : "encouraging",
      safety: {
        flagged: false,
      },
    };
  }
}

export function createMockAiProvider(): AiProvider {
  return new MockAiProvider();
}
