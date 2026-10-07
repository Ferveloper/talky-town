import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { normalizeVocabularyTerm } from "@talkytown/shared";
import { PersistenceIds } from "../common/persistence-ids.service";
import { practiceXp } from "./gamification-rules";
import { practicedTerms } from "./vocabulary-rules";
@Injectable()
export class GamificationService {
  constructor(private readonly ids: PersistenceIds) {}
  async award(
    db: Prisma.TransactionClient,
    input: {
      childId: string;
      sessionId: string;
      operationId: string;
      message: string;
      corrected: boolean;
      completed: boolean;
      missionCode?: string;
      completionReward: number;
      at: Date;
    },
  ) {
    const xp = practiceXp(input.message);
    const reward = input.completed ? input.completionReward : 0;
    if (xp > 0)
      await db.xpEvent.create({
        data: {
          id: this.ids.practiceXp(input.operationId),
          childProfileId: input.childId,
          sessionId: input.sessionId,
          amount: xp,
          reason: "practice-turn",
          source: input.operationId,
          createdAt: input.at,
        },
      });
    if (reward > 0)
      await db.xpEvent.create({
        data: {
          id: this.ids.completionXp(input.sessionId),
          childProfileId: input.childId,
          sessionId: input.sessionId,
          amount: reward,
          reason: "mission-completed",
          source: input.operationId,
          createdAt: input.at,
        },
      });
    const terms = practicedTerms(input.message);
    for (const term of terms) {
      const normalizedTerm = normalizeVocabularyTerm(term);
      await db.vocabularyItem.upsert({
        where: {
          childProfileId_language_normalizedTerm: {
            childProfileId: input.childId,
            language: "en",
            normalizedTerm,
          },
        },
        create: {
          childProfileId: input.childId,
          language: "en",
          term,
          normalizedTerm,
          practiceCount: 1,
          successfulUseCount: input.corrected ? 0 : 1,
          firstSeenAt: input.at,
          lastPracticedAt: input.at,
        },
        update: {
          practiceCount: { increment: 1 },
          successfulUseCount: { increment: input.corrected ? 0 : 1 },
          lastPracticedAt: input.at,
        },
      });
    }
    const codes = [
      ...(xp > 0 ? ["first-talk"] : []),
      ...(input.completed && input.missionCode === "animal-adventure" ? ["animal-explorer"] : []),
    ];
    const definitions = await db.badge.findMany({ where: { code: { in: codes } } });
    for (const badge of definitions)
      await db.childBadge.upsert({
        where: { childProfileId_badgeId: { childProfileId: input.childId, badgeId: badge.id } },
        create: {
          childProfileId: input.childId,
          badgeId: badge.id,
          source: input.operationId,
          awardedAt: input.at,
        },
        update: {},
      });
    const total = await db.xpEvent.aggregate({
      where: { childProfileId: input.childId },
      _sum: { amount: true },
    });
    const sessionTotal = await db.xpEvent.aggregate({
      where: { sessionId: input.sessionId },
      _sum: { amount: true },
    });
    await db.childProfile.update({
      where: { id: input.childId },
      data: { xpTotal: total._sum.amount ?? 0 },
    });
    await db.conversationSession.update({
      where: { id: input.sessionId },
      data: { xpEarned: sessionTotal._sum.amount ?? 0 },
    });
    return { practiceXp: xp, totalXp: xp + reward };
  }
}
