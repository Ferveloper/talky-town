import type { PrismaClient } from "@prisma/client";
import { demoProfiles, initialAvatars, initialMissions } from "@talkytown/shared";
import { badgeCatalog, synchronizeBadgeCatalog } from "../src/gamification/badge-catalog";
import { ApplicationClock } from "../src/common/application-clock";
import { streakDays } from "../src/gamification/streak-rules";

import {
  demoBadgeAwards,
  demoSessions,
  getDemoSessionXp,
  getDemoTurnTime,
  getDemoVocabulary,
} from "./demo-history";

export const demoBadges = badgeCatalog;

export async function seedDemo(prisma: PrismaClient, asOf = new ApplicationClock().now()) {
  return prisma.$transaction(
    async (db) => {
      const userData = {
        email: process.env.DEMO_USER_EMAIL ?? "demo@talkytown.local",
        displayAlias: process.env.DEMO_USER_ALIAS ?? "Demo Tutor",
        role: "adult",
      };
      const user = await db.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });

      for (const avatar of initialAvatars) {
        const data = {
          ...avatar,
          style: avatar.code === "luna" ? "Friendly star town guide" : "TalkyTown explorer",
          isActive: true,
        };
        await db.avatar.upsert({ where: { code: avatar.code }, update: data, create: data });
      }

      for (const [index, mission] of initialMissions.entries()) {
        const { estimatedXp, ...summary } = mission;
        const data = { ...summary, xpReward: estimatedXp, sortOrder: index + 1, isActive: true };
        await db.mission.upsert({ where: { code: mission.code }, update: data, create: data });
      }

      await synchronizeBadgeCatalog(db);

      const providerData = { baseUrl: null, model: "talkytown-mock" };
      const activeProviders = await db.aiProviderConfig.count({
        where: { userId: user.id, isActive: true },
      });
      await db.aiProviderConfig.upsert({
        where: { userId_providerType: { userId: user.id, providerType: "mock" } },
        update: providerData,
        create: {
          userId: user.id,
          providerType: "mock",
          ...providerData,
          isActive: activeProviders === 0,
        },
      });

      for (const profile of demoProfiles) {
        const avatar = await db.avatar.findUniqueOrThrow({ where: { code: profile.avatarCode } });
        const profileData = {
          alias: profile.alias,
          age: profile.age,
          ageBand: profile.ageBand,
          nativeLanguage: "es",
          targetLanguage: profile.targetLanguage,
          level: profile.level,
          avatarId: avatar.id,
        };
        const child = await db.childProfile.upsert({
          where: { userId_alias: { userId: user.id, alias: profile.alias } },
          update: profileData,
          create: { userId: user.id, ...profileData },
        });

        for (const session of demoSessions.filter((item) => item.alias === profile.alias)) {
          const sessionId = `demo-${child.id}-${session.key}`;
          const sessionAvatar = await db.avatar.findUniqueOrThrow({
            where: { code: session.avatarCode },
          });
          const mission = session.missionCode
            ? await db.mission.findUniqueOrThrow({ where: { code: session.missionCode } })
            : null;
          const sessionData = {
            childProfileId: child.id,
            avatarId: sessionAvatar.id,
            missionId: mission?.id ?? null,
            mode: mission ? "guided-mission" : "free-talk",
            status: "completed",
            missionProgress: mission ? 100 : 0,
            aiProviderType: "mock",
            aiModel: "talkytown-mock",
            xpEarned: getDemoSessionXp(session),
            startedAt: session.startedAt,
            endedAt: session.endedAt,
          };
          await db.conversationSession.upsert({
            where: { id: sessionId },
            update: sessionData,
            create: { id: sessionId, ...sessionData },
          });

          for (const [index, turn] of session.turns.entries()) {
            const turnId = `${sessionId}-turn-${index}`;
            const turnData = {
              sessionId,
              role: turn.role,
              content: turn.content,
              correctionNeeded: Boolean(turn.correctedContent),
              correctedContent: turn.correctedContent ?? null,
              correctionExplanation: turn.correctionExplanation ?? null,
              inputMode: "text",
              xpAwarded: turn.xpAwarded,
              createdAt: getDemoTurnTime(session, index),
            };
            await db.conversationTurn.upsert({
              where: { id: turnId },
              update: turnData,
              create: { id: turnId, ...turnData },
            });
            if (turn.xpAwarded > 0) {
              const xpData = {
                childProfileId: child.id,
                sessionId,
                amount: turn.xpAwarded,
                reason: "practice-turn",
                source: "demo",
                createdAt: turnData.createdAt,
              };
              await db.xpEvent.upsert({
                where: { id: `${turnId}-xp` },
                update: xpData,
                create: { id: `${turnId}-xp`, ...xpData },
              });
            }
          }

          if (session.completionXp > 0) {
            const xpId = `${sessionId}-completion-xp`;
            const xpData = {
              childProfileId: child.id,
              sessionId,
              amount: session.completionXp,
              reason: "mission-completed",
              source: "demo",
              createdAt: session.endedAt,
            };
            await db.xpEvent.upsert({
              where: { id: xpId },
              update: xpData,
              create: { id: xpId, ...xpData },
            });
          }
        }

        for (const award of demoBadgeAwards.filter((item) => item.alias === profile.alias)) {
          const badge = await db.badge.findUniqueOrThrow({ where: { code: award.badgeCode } });
          const data = { awardedAt: award.awardedAt, source: "demo" };
          await db.childBadge.upsert({
            where: { childProfileId_badgeId: { childProfileId: child.id, badgeId: badge.id } },
            update: {},
            create: { childProfileId: child.id, badgeId: badge.id, ...data },
          });
        }

        for (const vocabulary of getDemoVocabulary(profile.alias)) {
          await db.vocabularyItem.upsert({
            where: {
              childProfileId_language_normalizedTerm: {
                childProfileId: child.id,
                language: vocabulary.language,
                normalizedTerm: vocabulary.normalizedTerm,
              },
            },
            update: vocabulary,
            create: { childProfileId: child.id, ...vocabulary },
          });
        }

        const xp = await db.xpEvent.findMany({
          where: { childProfileId: child.id },
        });
        await db.childProfile.update({
          where: { id: child.id },
          data: {
            xpTotal: xp.reduce((total, event) => total + event.amount, 0),
            streakDays: streakDays(xp, asOf),
          },
        });
      }
      return user;
    },
    { timeout: 30_000 },
  );
}
