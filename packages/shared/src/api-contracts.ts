import type {
  AgeBand,
  AiProviderType,
  LearningLevel,
  MissionSummary,
  VocabularyItemSummary,
} from "./index";
import type { SessionResponse } from "./conversation-contracts";
export type AdultIdentity = { id: string; displayAlias: string; role: "adult" };
export type DemoLoginResponse = {
  accessToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  user: AdultIdentity;
};
export type CreateChildProfileRequest = {
  alias: string;
  age: number;
  nativeLanguage: "es";
  targetLanguage: "en";
  learningLevel: LearningLevel;
  avatarCode: string;
};
export type ChildProfileResponse = {
  id: string;
  alias: string;
  age: number;
  ageBand: AgeBand;
  nativeLanguage: string;
  targetLanguage: string;
  learningLevel: LearningLevel;
  avatarCode: string | null;
  xpTotal: number;
  streakDays: number;
};
export type MissionResponse = MissionSummary & { id: string };
export type ProgressResponse = {
  childProfileId: string;
  learningLevel: LearningLevel;
  streakDays: number;
  xpTotal: number;
  completedSessions: number;
  completedMissionCount: number;
  completedMissionCodes: string[];
  badges: { code: string; title: string; awardedAt: string }[];
  vocabulary: VocabularyItemSummary[];
  lastPracticedAt: string | null;
  recentSessions: SessionResponse[];
};
export type SetActiveProviderRequest = { providerType: AiProviderType };
export type ApiErrorResponse = {
  code: string;
  fields?: { field: string; rules: string[] }[];
  activeSessionCount?: number;
};
