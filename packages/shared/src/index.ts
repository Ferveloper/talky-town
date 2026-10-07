export type AgeBand = "5-7" | "8-10" | "11-12";

export * from "./api-contracts";
export * from "./conversation-contracts";

export type LearningLevel = "starter" | "explorer" | "hero";

export type PracticeMode = "free-talk" | "guided-mission";

export type AvatarEmotion = "happy" | "thinking" | "celebrating" | "encouraging";

export type AiProviderType = "mock" | "openai-compatible-cloud" | "local-openai-compatible";

export type ApiHealthResponse = {
  status: "ok";
  service: "talkytown-api";
};

export type ChildProfileSummary = {
  id: string;
  alias: string;
  age: number;
  ageBand: AgeBand;
  level: LearningLevel;
  targetLanguage: "en";
  avatarCode: string;
  xpTotal: number;
  streakDays: number;
};

export type AvatarSummary = {
  code: string;
  name: string;
  personality: string;
};

export type MissionSummary = {
  code: string;
  title: string;
  description: string;
  minAge: number;
  maxAge: number;
  estimatedXp: number;
};

export type BadgeSummary = {
  code: string;
  title: string;
  description: string;
};

export type ChildBadgeSummary = {
  id: string;
  childProfileId: string;
  badgeId: string;
  awardedAt: string;
  source?: string;
};

export type VocabularyItemSummary = {
  id: string;
  childProfileId: string;
  language: string;
  term: string;
  normalizedTerm: string;
  practiceCount: number;
  successfulUseCount: number;
  firstSeenAt: string;
  lastPracticedAt: string;
};

export function normalizeVocabularyTerm(term: string): string {
  return term.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

export const demoProfiles = [
  {
    id: "demo-sofia",
    alias: "Sofia",
    age: 9,
    ageBand: "8-10",
    level: "explorer",
    targetLanguage: "en",
    avatarCode: "luna",
    xpTotal: 120,
    streakDays: 3,
  },
  {
    id: "demo-leo",
    alias: "Leo",
    age: 6,
    ageBand: "5-7",
    level: "starter",
    targetLanguage: "en",
    avatarCode: "max",
    xpTotal: 35,
    streakDays: 1,
  },
] satisfies ChildProfileSummary[];

export const initialAvatars = [
  {
    code: "luna",
    name: "Luna",
    personality: "Patient town guide",
  },
  {
    code: "max",
    name: "Max",
    personality: "Energetic mission buddy",
  },
] satisfies AvatarSummary[];

export const initialMissions = [
  {
    code: "meet-a-new-friend",
    title: "Meet a New Friend",
    description: "Say hello and practice simple greetings.",
    minAge: 5,
    maxAge: 7,
    estimatedXp: 25,
  },
  {
    code: "animal-adventure",
    title: "Animal Adventure",
    description: "Talk about favorite animals with Luna.",
    minAge: 5,
    maxAge: 10,
    estimatedXp: 30,
  },
  {
    code: "ice-cream-shop",
    title: "Ice Cream Shop",
    description: "Order a treat in English.",
    minAge: 8,
    maxAge: 12,
    estimatedXp: 40,
  },
  {
    code: "space-explorer",
    title: "Space Explorer",
    description: "Answer questions on a safe space trip.",
    minAge: 8,
    maxAge: 12,
    estimatedXp: 50,
  },
] satisfies MissionSummary[];
