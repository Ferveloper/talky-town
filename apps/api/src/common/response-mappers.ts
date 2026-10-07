import type { Prisma, ConversationTurn } from "@prisma/client";
import type {
  AgeBand,
  AiProviderType,
  ChildProfileResponse,
  InputMode,
  LearningLevel,
  PracticeMode,
  SessionResponse,
  SessionStatus,
  TurnResponse,
  TurnRole,
} from "@talkytown/shared";
export const sessionInclude = {
  avatar: true,
  mission: true,
  xpEvents: { select: { amount: true } },
} as const;
export type SessionRecord = Prisma.ConversationSessionGetPayload<{
  include: typeof sessionInclude;
}>;
export const profileInclude = { avatar: true, xpEvents: { select: { amount: true } } } as const;
export type ProfileRecord = Prisma.ChildProfileGetPayload<{ include: typeof profileInclude }>;
export function profileResponse(profile: ProfileRecord): ChildProfileResponse {
  return {
    id: profile.id,
    alias: profile.alias,
    age: profile.age,
    ageBand: profile.ageBand as AgeBand,
    nativeLanguage: profile.nativeLanguage,
    targetLanguage: profile.targetLanguage,
    learningLevel: profile.level as LearningLevel,
    avatarCode: profile.avatar?.code ?? null,
    xpTotal: profile.xpEvents.reduce((sum, event) => sum + event.amount, 0),
    streakDays: profile.streakDays,
  };
}
export function sessionResponse(session: SessionRecord): SessionResponse {
  return {
    id: session.id,
    childProfileId: session.childProfileId,
    avatarCode: session.avatar?.code ?? null,
    missionCode: session.mission?.code ?? null,
    mode: session.mode as PracticeMode,
    status: session.status as SessionStatus,
    missionProgress: session.missionProgress,
    xpEarned: session.xpEvents.reduce((sum, event) => sum + event.amount, 0),
    aiProviderType: session.aiProviderType as AiProviderType | null,
    aiModel: session.aiModel,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
  };
}
export function turnResponse(turn: ConversationTurn): TurnResponse {
  return {
    id: turn.id,
    role: turn.role as TurnRole,
    content: turn.content,
    inputMode: turn.inputMode as InputMode,
    correction: {
      needed: turn.correctionNeeded,
      ...(turn.correctedContent ? { corrected: turn.correctedContent } : {}),
      ...(turn.correctionExplanation ? { explanation: turn.correctionExplanation } : {}),
    },
    xpAwarded: turn.xpAwarded,
    createdAt: turn.createdAt.toISOString(),
  };
}
