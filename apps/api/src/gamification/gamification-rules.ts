export function practiceXp(message: string): number {
  return /\p{Script=Latin}/u.test(message.normalize("NFKC")) ? 5 : 0;
}

export const XP_PER_LEVEL = 50;
export function levelProgress(xpTotal: number) {
  const xpIntoLevel = xpTotal % XP_PER_LEVEL;
  return {
    gamificationLevel: Math.floor(xpTotal / XP_PER_LEVEL) + 1,
    levelProgress: {
      xpIntoLevel,
      xpToNextLevel: XP_PER_LEVEL - xpIntoLevel,
      xpPerLevel: XP_PER_LEVEL as 50,
    },
  };
}

export type PracticeEvent = { amount: number; reason: string; createdAt: Date };
export function acceptedPracticeEvents<T extends PracticeEvent>(events: readonly T[]): T[] {
  return events.filter((event) => event.reason === "practice-turn" && event.amount > 0);
}
