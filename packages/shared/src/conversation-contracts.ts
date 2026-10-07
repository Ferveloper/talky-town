import type { AiProviderType, PracticeMode } from "./index";
export type SessionStatus = "active" | "completed" | "abandoned";
export type TurnRole = "child" | "avatar" | "system";
export type InputMode = "text" | "voice";
export type SafeCorrection = { needed: boolean; corrected?: string; explanation?: string };
export type StartSessionRequest = {
  requestId: string;
  childProfileId: string;
  mode: PracticeMode;
  missionCode?: string;
};
export type SendMessageRequest = { requestId: string; message: string; inputMode?: InputMode };
export type SessionResponse = {
  id: string;
  childProfileId: string;
  avatarCode: string | null;
  missionCode: string | null;
  mode: PracticeMode;
  status: SessionStatus;
  missionProgress: number;
  xpEarned: number;
  aiProviderType: AiProviderType | null;
  aiModel: string | null;
  startedAt: string;
  endedAt: string | null;
};
export type TurnResponse = {
  id: string;
  role: TurnRole;
  content: string;
  inputMode: InputMode;
  correction: SafeCorrection;
  xpAwarded: number;
  createdAt: string;
};
export type MessageResponse = {
  childTurn: TurnResponse | null;
  avatarTurn: TurnResponse;
  xpAwarded: number;
  practicedVocabulary: string[];
  awardedBadges: string[];
  safety: { flagged: boolean; reason?: string };
  session: SessionResponse;
};
export type TurnsResponse = { items: TurnResponse[]; nextCursor: string | null };
