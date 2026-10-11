import { Injectable } from "@nestjs/common";
import type { LearningLevel, ProgressResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { sessionInclude, sessionResponse } from "../common/response-mappers";
import { ApplicationClock } from "../common/application-clock";
import { acceptedPracticeEvents, levelProgress } from "../gamification/gamification-rules";
import { PRACTICE_TIMEZONE, streakDays } from "../gamification/streak-rules";
import { badgeCatalog } from "../gamification/badge-catalog";
@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: ProfileOwnershipService,
    private readonly clock: ApplicationClock,
  ) {}
  async get(userId: string, childId: string): Promise<ProgressResponse> {
    const asOf = this.clock.now();
    return this.prisma.$transaction(
      async (db) => {
        const profile = await this.ownership.get(userId, childId, db);
        const events = await db.xpEvent.findMany({
          where: { childProfileId: childId },
        });
        const xpTotal = events.reduce((sum, event) => sum + event.amount, 0);
        const sessions = await db.conversationSession.findMany({
          where: { childProfileId: childId },
          include: sessionInclude,
          orderBy: [{ startedAt: "desc" }, { id: "desc" }],
        });
        const awards = await db.childBadge.findMany({
          where: { childProfileId: childId },
          include: { badge: true },
          orderBy: [{ awardedAt: "asc" }, { id: "asc" }],
        });
        const vocabulary = await db.vocabularyItem.findMany({
          where: { childProfileId: childId },
          orderBy: { normalizedTerm: "asc" },
        });
        const practice = acceptedPracticeEvents(events).sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
        )[0];
        const completed = sessions.filter((session) => session.status === "completed");
        const missionCodes = [
          ...new Set(
            completed
              .filter((session) => session.mission && session.missionProgress === 100)
              .map((session) => session.mission!.code),
          ),
        ].sort();
        return {
          childProfileId: childId,
          learningLevel: profile.level as LearningLevel,
          streakDays: streakDays(events, asOf),
          xpTotal,
          ...levelProgress(xpTotal),
          practiceTimezone: PRACTICE_TIMEZONE,
          badgeCatalog: badgeCatalog.map((badge) => {
            const award = awards.find((award) => award.badge.code === badge.code);
            return {
              code: badge.code,
              title: badge.title,
              description: badge.description,
              icon: badge.icon,
              unlocked: Boolean(award),
              awardedAt: award?.awardedAt.toISOString() ?? null,
            };
          }),
          completedSessions: completed.length,
          completedMissionCount: missionCodes.length,
          completedMissionCodes: missionCodes,
          badges: awards.map((award) => ({
            code: award.badge.code,
            title: award.badge.title,
            awardedAt: award.awardedAt.toISOString(),
          })),
          vocabulary: vocabulary.map((word) => ({
            ...word,
            firstSeenAt: word.firstSeenAt.toISOString(),
            lastPracticedAt: word.lastPracticedAt.toISOString(),
          })),
          lastPracticedAt: practice?.createdAt.toISOString() ?? null,
          recentSessions: sessions.slice(0, 10).map(sessionResponse),
        };
      },
      { isolationLevel: "RepeatableRead" },
    );
  }
}
