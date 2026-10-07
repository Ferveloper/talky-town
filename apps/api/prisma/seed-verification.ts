import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import type { PrismaClient } from "@prisma/client";
import { demoProfiles, initialAvatars, initialMissions } from "@talkytown/shared";

import {
  demoBadgeAwards,
  demoSessions,
  getDemoSessionXp,
  getDemoTurnTime,
  getDemoVocabulary,
} from "./demo-history";
import { demoBadges } from "./seed-demo";

export async function verifyDemoData(prisma: PrismaClient) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: process.env.DEMO_USER_EMAIL ?? "demo@talkytown.local" },
    select: { id: true, email: true, displayAlias: true, role: true },
  });
  assert.equal(user.role, "adult");
  const avatars = await prisma.avatar.findMany({
    where: { code: { in: initialAvatars.map((item) => item.code) } },
    orderBy: { code: "asc" },
    select: { id: true, code: true, name: true, personality: true, style: true, isActive: true },
  });
  assert.equal(avatars.length, 2);
  const missions = await prisma.mission.findMany({
    where: { code: { in: initialMissions.map((item) => item.code) } },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      minAge: true,
      maxAge: true,
      xpReward: true,
      sortOrder: true,
      isActive: true,
    },
  });
  assert.equal(missions.length, 4);
  for (const expected of initialMissions) {
    const mission = missions.find((item) => item.code === expected.code);
    assert(mission);
    assert.equal(mission.minAge, expected.minAge);
    assert.equal(mission.maxAge, expected.maxAge);
    assert.equal(mission.xpReward, expected.estimatedXp);
  }
  const badges = await prisma.badge.findMany({
    where: { code: { in: demoBadges.map((item) => item.code) } },
    orderBy: { code: "asc" },
    select: { id: true, code: true, title: true, description: true, icon: true, xpRequired: true },
  });
  assert.equal(badges.length, 5);
  const provider = await prisma.aiProviderConfig.findUniqueOrThrow({
    where: { userId_providerType: { userId: user.id, providerType: "mock" } },
    select: {
      id: true,
      userId: true,
      providerType: true,
      baseUrl: true,
      model: true,
      isActive: true,
    },
  });
  assert.equal(provider.baseUrl, null);
  assert.equal(provider.model, "talkytown-mock");
  const activeProviders = await prisma.aiProviderConfig.count({
    where: { userId: user.id, isActive: true },
  });
  assert.equal(activeProviders, 1, "Exactly one adult provider must be active.");

  const profiles = [];
  for (const expected of demoProfiles) {
    const child = await prisma.childProfile.findUniqueOrThrow({
      where: { userId_alias: { userId: user.id, alias: expected.alias } },
      select: {
        id: true,
        userId: true,
        avatarId: true,
        alias: true,
        age: true,
        ageBand: true,
        nativeLanguage: true,
        targetLanguage: true,
        level: true,
        xpTotal: true,
        streakDays: true,
      },
    });
    assert.equal(child.age, expected.age);
    assert.equal(child.avatarId, avatars.find((item) => item.code === expected.avatarCode)?.id);
    assert.equal(child.streakDays, expected.streakDays);
    const sessions = await prisma.conversationSession.findMany({
      where: { childProfileId: child.id, id: { startsWith: `demo-${child.id}-` } },
      orderBy: { id: "asc" },
      include: { turns: { orderBy: { createdAt: "asc" } }, xpEvents: { orderBy: { id: "asc" } } },
    });
    const expectedSessions = demoSessions.filter((item) => item.alias === expected.alias);
    assert.equal(sessions.length, expectedSessions.length);
    for (const fixture of expectedSessions) {
      const session = sessions.find((item) => item.id === `demo-${child.id}-${fixture.key}`);
      assert(session);
      assert.equal(session.status, "completed");
      assert.equal(session.aiProviderType, "mock");
      assert.equal(session.aiModel, "talkytown-mock");
      assert.equal(session.xpEarned, getDemoSessionXp(fixture));
      assert.equal(
        session.xpEarned,
        session.xpEvents.reduce((sum, item) => sum + item.amount, 0),
      );
      assert(
        session.xpEvents.every(
          (item) => item.childProfileId === child.id && item.source === "demo",
        ),
      );
      assert.equal(
        session.xpEvents.length,
        fixture.turns.filter((turn) => turn.xpAwarded > 0).length +
          Number(fixture.completionXp > 0),
      );
      assert.equal(session.startedAt.toISOString(), fixture.startedAt.toISOString());
      assert.equal(session.endedAt?.toISOString(), fixture.endedAt.toISOString());
      assert.equal(session.missionProgress, fixture.missionCode ? 100 : 0);
      assert.equal(
        session.missionId,
        missions.find((item) => item.code === fixture.missionCode)?.id ?? null,
      );
      assert.equal(session.avatarId, avatars.find((item) => item.code === fixture.avatarCode)?.id);
      assert.equal(session.turns.length, fixture.turns.length);
      fixture.turns.forEach((turn, index) => {
        const actual = session.turns[index];
        assert(actual);
        assert.equal(actual.role, turn.role);
        assert.equal(actual.content, turn.content);
        assert.equal(actual.xpAwarded, turn.xpAwarded);
        assert.equal(actual.correctionNeeded, Boolean(turn.correctedContent));
        assert.equal(actual.correctedContent, turn.correctedContent ?? null);
        assert.equal(actual.correctionExplanation, turn.correctionExplanation ?? null);
        assert.equal(actual.inputMode, "text");
        assert.equal(actual.createdAt.toISOString(), getDemoTurnTime(fixture, index).toISOString());
      });
    }

    const awards = await prisma.childBadge.findMany({
      where: { childProfileId: child.id, source: "demo" },
      orderBy: { badgeId: "asc" },
    });
    const expectedAwards = demoBadgeAwards.filter((item) => item.alias === expected.alias);
    assert.equal(awards.length, expectedAwards.length);
    for (const expectedAward of expectedAwards) {
      const badge = badges.find((item) => item.code === expectedAward.badgeCode);
      const award = awards.find((item) => item.badgeId === badge?.id);
      assert(award);
      assert.equal(award.awardedAt.toISOString(), expectedAward.awardedAt.toISOString());
    }
    const expectedVocabulary = getDemoVocabulary(child.alias);
    const vocabulary = await prisma.vocabularyItem.findMany({
      where: {
        childProfileId: child.id,
        language: "en",
        normalizedTerm: { in: expectedVocabulary.map((item) => item.normalizedTerm) },
      },
      orderBy: { normalizedTerm: "asc" },
    });
    assert.equal(vocabulary.length, expectedVocabulary.length);
    for (const term of expectedVocabulary) {
      const actual = vocabulary.find((item) => item.normalizedTerm === term.normalizedTerm);
      assert(actual);
      for (const key of ["term", "practiceCount", "successfulUseCount"] as const)
        assert.equal(actual[key], term[key]);
      assert.equal(actual.firstSeenAt.toISOString(), term.firstSeenAt.toISOString());
      assert.equal(actual.lastPracticedAt.toISOString(), term.lastPracticedAt.toISOString());
    }
    const xp = await prisma.xpEvent.aggregate({
      where: { childProfileId: child.id },
      _sum: { amount: true },
    });
    assert.equal(child.xpTotal, xp._sum.amount ?? 0);
    const demoXp = sessions.reduce((sum, session) => sum + session.xpEarned, 0);
    assert.equal(demoXp, expected.xpTotal);
    profiles.push({ child, sessions, awards, vocabulary });
  }

  const snapshot = { user, avatars, missions, badges, provider, profiles };
  return {
    fingerprint: createHash("sha256").update(JSON.stringify(snapshot)).digest("hex"),
    counts: {
      users: 1,
      profiles: profiles.length,
      avatars: avatars.length,
      missions: missions.length,
      badges: badges.length,
      sessions: profiles.reduce((sum, item) => sum + item.sessions.length, 0),
      turns: profiles.reduce(
        (sum, item) =>
          sum + item.sessions.reduce((count, session) => count + session.turns.length, 0),
        0,
      ),
      xpEvents: profiles.reduce(
        (sum, item) =>
          sum + item.sessions.reduce((count, session) => count + session.xpEvents.length, 0),
        0,
      ),
      childBadges: profiles.reduce((sum, item) => sum + item.awards.length, 0),
      vocabulary: profiles.reduce((sum, item) => sum + item.vocabulary.length, 0),
    },
  };
}
