import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { normalizeVocabularyTerm } from "@talkytown/shared";
import { PersistenceIds } from "../common/persistence-ids.service";
import { acceptedPracticeEvents, practiceXp } from "./gamification-rules";
import { practicedTerms } from "./vocabulary-rules";
import { synchronizeBadgeCatalog } from "./badge-catalog";
import { badgeEligibility, type BadgeEligibility } from "./badge-rules";
import { readBadgeEvidence } from "./badge-evidence";
import { streakDays } from "./streak-rules";
@Injectable()
export class GamificationService {
  constructor(private readonly ids: PersistenceIds) {}
  async completeFreeTalk(
    db: Prisma.TransactionClient,
    childId: string,
    sessionId: string,
    at: Date,
  ) {
    const events = await db.xpEvent.findMany({ where: { childProfileId: childId, sessionId } });
    if (acceptedPracticeEvents(events).length < 3) return;
    await db.xpEvent.create({
      data: {
        id: this.ids.completionXp(sessionId),
        childProfileId: childId,
        sessionId,
        amount: 10,
        reason: "free-talk-completed",
        source: `end:${sessionId}`,
        createdAt: at,
      },
    });
    const { evidence } = await readBadgeEvidence(db, childId);
    await this.refreshCaches(db, childId, sessionId, evidence.practice, at);
  }
  private async refreshCaches(
    db: Prisma.TransactionClient,
    childId: string,
    sessionId: string,
    practice: Parameters<typeof streakDays>[0],
    at: Date,
  ) {
    const total = await db.xpEvent.aggregate({
      where: { childProfileId: childId },
      _sum: { amount: true },
    });
    const sessionTotal = await db.xpEvent.aggregate({
      where: { sessionId },
      _sum: { amount: true },
    });
    await db.childProfile.update({
      where: { id: childId },
      data: { xpTotal: total._sum.amount ?? 0, streakDays: streakDays(practice, at) },
    });
    await db.conversationSession.update({
      where: { id: sessionId },
      data: { xpEarned: sessionTotal._sum.amount ?? 0 },
    });
  }
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
      before: BadgeEligibility;
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
    // Synchronize even fresh non-demo installations; a missing definition must not suppress an award.
    await synchronizeBadgeCatalog(db);
    const { evidence } = await readBadgeEvidence(db, input.childId);
    // Mission termination and the avatar turn are stored one millisecond after the child event.
    // Evaluate through that operation boundary, including a completion crossing Madrid midnight.
    const after = badgeEligibility(evidence, new Date(input.at.getTime() + 1));
    const codes = Object.keys(after).filter((code) => after[code] && !input.before[code]);
    const definitions = await db.badge.findMany({ where: { code: { in: codes } } });
    if (definitions.length !== codes.length) throw new Error("BADGE_CATALOG_INCOMPLETE");
    for (const badge of definitions)
      await db.childBadge.upsert({
        where: { childProfileId_badgeId: { childProfileId: input.childId, badgeId: badge.id } },
        create: {
          childProfileId: input.childId,
          badgeId: badge.id,
          source: input.operationId,
          awardedAt: after[badge.code]!,
        },
        update: {},
      });
    await this.refreshCaches(db, input.childId, input.sessionId, evidence.practice, input.at);
    return { practiceXp: xp, totalXp: xp + reward };
  }
}
