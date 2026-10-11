import type { BadgeCode } from "./badge-catalog";
import { acceptedPracticeEvents, type PracticeEvent } from "./gamification-rules";
import { practiceDay, threeDayAchievementAt } from "./streak-rules";

export type BadgeEvidence = {
  practice: PracticeEvent[];
  guided: { id: string; missionCode: string; endedAt: Date }[];
  corrections: Date[];
};
export type BadgeEligibility = Partial<Record<BadgeCode, Date>>;
export function genuineCorrection(original: string, corrected: string | null): boolean {
  const normalize = (text: string) => text.normalize("NFKC").trim().replace(/\s+/gu, " ");
  return (
    corrected !== null &&
    normalize(corrected).length > 0 &&
    normalize(original) !== normalize(corrected)
  );
}
export function badgeEligibility(evidence: BadgeEvidence, asOf: Date): BadgeEligibility {
  const available = (at: Date) => practiceDay(at) <= practiceDay(asOf);
  const practice = acceptedPracticeEvents(evidence.practice)
    .filter((event) => available(event.createdAt))
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const guided = evidence.guided
    .filter((session) => available(session.endedAt))
    .sort((a, b) => a.endedAt.getTime() - b.endedAt.getTime() || a.id.localeCompare(b.id));
  const corrections = evidence.corrections
    .filter(available)
    .sort((a, b) => a.getTime() - b.getTime());
  const eligibility: BadgeEligibility = {};
  eligibility["first-talk"] = practice[0]?.createdAt;
  eligibility["brave-speaker"] = practice[9]?.createdAt;
  eligibility["animal-explorer"] = guided.find(
    (session) => session.missionCode === "animal-adventure",
  )?.endedAt;
  eligibility["mission-complete"] = guided[0]?.endedAt;
  eligibility["mission-hero"] = guided[2]?.endedAt;
  eligibility["kind-corrector"] = corrections[0];
  eligibility["three-day-streak"] = threeDayAchievementAt(practice, asOf);
  return eligibility;
}
