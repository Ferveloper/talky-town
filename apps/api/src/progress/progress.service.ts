import { Injectable } from "@nestjs/common";
import type { LearningLevel, ProgressResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { sessionInclude, sessionResponse } from "../common/response-mappers";
@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: ProfileOwnershipService,
  ) {}
  async get(userId: string, childId: string): Promise<ProgressResponse> {
    return this.prisma.$transaction(
      async (db) => {
        const profile = await this.ownership.get(userId, childId, db);
        const xp = await db.xpEvent.aggregate({
          where: { childProfileId: childId },
          _sum: { amount: true },
        });
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
        const practice = await db.conversationTurn.findFirst({
          where: { session: { childProfileId: childId }, role: "child", xpAwarded: { gt: 0 } },
          orderBy: { createdAt: "desc" },
        });
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
          streakDays: profile.streakDays,
          xpTotal: xp._sum.amount ?? 0,
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
