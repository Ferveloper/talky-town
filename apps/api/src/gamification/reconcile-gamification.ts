import type { Prisma, PrismaClient } from "@prisma/client";
import { badgeCatalog, synchronizeBadgeCatalog } from "./badge-catalog";
import { readBadgeEvidence } from "./badge-evidence";
import { badgeEligibility } from "./badge-rules";
import { streakDays } from "./streak-rules";

async function reconcileProfile(
  db: Prisma.TransactionClient,
  childId: string,
  asOf: Date,
  apply: boolean,
) {
  const profile = await db.childProfile.findUniqueOrThrow({ where: { id: childId } });
  const { evidence, unlinkedPracticeEventIds } = await readBadgeEvidence(db, childId);
  const eligible = badgeEligibility(evidence, asOf);
  const awards = await db.childBadge.findMany({
    where: { childProfileId: childId },
    include: { badge: true },
  });
  const missing = badgeCatalog
    .filter(
      (badge) => eligible[badge.code] && !awards.some((award) => award.badge.code === badge.code),
    )
    .map((badge) => ({ code: badge.code, awardedAt: eligible[badge.code]!.toISOString() }));
  const xpTotal = evidence.practice.reduce((total, event) => total + event.amount, 0);
  const streak = streakDays(evidence.practice, asOf);
  const profileCacheChanged = profile.xpTotal !== xpTotal || profile.streakDays !== streak;
  const sessions = await db.conversationSession.findMany({
    where: { childProfileId: childId },
    include: { xpEvents: true },
  });
  const sessionCaches = sessions
    .map((session) => ({
      id: session.id,
      xpEarned: session.xpEvents.reduce((total, event) => total + event.amount, 0),
      previous: session.xpEarned,
    }))
    .filter((session) => session.previous !== session.xpEarned);
  if (apply) {
    for (const award of missing) {
      const badge = await db.badge.findUniqueOrThrow({ where: { code: award.code } });
      await db.childBadge.upsert({
        where: { childProfileId_badgeId: { childProfileId: childId, badgeId: badge.id } },
        create: {
          childProfileId: childId,
          badgeId: badge.id,
          awardedAt: new Date(award.awardedAt),
          source: "phase7-reconciliation",
        },
        update: {},
      });
    }
    if (profileCacheChanged)
      await db.childProfile.update({
        where: { id: childId },
        data: { xpTotal, streakDays: streak },
      });
    for (const session of sessionCaches)
      await db.conversationSession.update({
        where: { id: session.id },
        data: { xpEarned: session.xpEarned },
      });
  }
  return {
    childProfileId: childId,
    xpTotal,
    streakDays: streak,
    profileCacheChanged,
    sessionCaches,
    missingAwards: missing,
    unlinkedPracticeEventIds,
  };
}

/** Administrative only. Default dry-run; no provider calls, XP creation or modification of existing awards. */
export async function reconcileGamification(
  prisma: PrismaClient,
  options: { apply?: boolean; childProfileId?: string; asOf: Date },
) {
  const profiles = await prisma.childProfile.findMany({
    where: options.childProfileId ? { id: options.childProfileId } : {},
    orderBy: { id: "asc" },
    select: { id: true, userId: true },
  });
  if (options.childProfileId && profiles.length === 0) throw new Error("PROFILE_NOT_FOUND");
  const existing = await prisma.badge.findMany({
    where: { code: { in: badgeCatalog.map((badge) => badge.code) } },
  });
  const catalogChanges = badgeCatalog
    .filter(
      (badge) =>
        !existing.some(
          (row) =>
            row.code === badge.code &&
            row.title === badge.title &&
            row.description === badge.description &&
            row.icon === badge.icon &&
            row.xpRequired === null,
        ),
    )
    .map((badge) => badge.code);
  if (options.apply) await prisma.$transaction((db) => synchronizeBadgeCatalog(db));
  const results = [];
  for (const profile of profiles) {
    results.push(
      await prisma.$transaction(
        async (db) => {
          if (options.apply) {
            const locked = await db.$queryRaw<
              { id: string }[]
            >`SELECT "id" FROM "ChildProfile" WHERE "id" = ${profile.id} AND "userId" = ${profile.userId} FOR UPDATE`;
            if (!locked.length) throw new Error("PROFILE_NOT_FOUND");
          }
          return reconcileProfile(db, profile.id, options.asOf, Boolean(options.apply));
        },
        options.apply ? { timeout: 30000 } : { isolationLevel: "RepeatableRead", timeout: 30000 },
      ),
    );
  }
  return {
    mode: options.apply ? "apply" : "dry-run",
    asOf: options.asOf.toISOString(),
    catalogChanges,
    profiles: results,
  };
}
