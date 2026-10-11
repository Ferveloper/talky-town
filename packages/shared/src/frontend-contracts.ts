import type {
  AvatarSummary,
  ChildProfileResponse,
  MissionResponse,
  SessionResponse,
  TurnResponse,
} from "./index";
export type ChildProfilesResponse = { items: ChildProfileResponse[] };
export type AvatarsResponse = { items: AvatarSummary[] };
export type MissionsResponse = { items: MissionResponse[] };
export type StartSessionResponse = { session: SessionResponse; openingTurn: TurnResponse };
