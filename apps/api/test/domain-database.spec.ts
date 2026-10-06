import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { seedDemo } from "../prisma/seed-demo";
import { verifyDemoData } from "../prisma/seed-verification";

const prisma = new PrismaClient();

describe("Phase 3 PostgreSQL domain", () => {
  beforeAll(async () => {
    await seedDemo(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("keeps the complete demo fingerprint unchanged on a second seed", async () => {
    const first = await verifyDemoData(prisma);
    await seedDemo(prisma);
    expect(await verifyDemoData(prisma)).toEqual(first);
    expect(first.counts).toEqual({
      users: 1,
      profiles: 2,
      avatars: 2,
      missions: 4,
      badges: 5,
      sessions: 4,
      turns: 22,
      xpEvents: 14,
      childBadges: 4,
      vocabulary: 6,
    });
  });

  it("rejects duplicate child badge awards", async () => {
    const award = await prisma.childBadge.findFirstOrThrow({ where: { source: "demo" } });
    await expect(
      prisma.childBadge.create({
        data: { childProfileId: award.childProfileId, badgeId: award.badgeId },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects duplicate normalized child vocabulary", async () => {
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: process.env.DEMO_USER_EMAIL ?? "demo@talkytown.local" },
    });
    const child = await prisma.childProfile.findUniqueOrThrow({
      where: { userId_alias: { userId: user.id, alias: "Sofia" } },
    });
    await expect(
      prisma.vocabularyItem.create({
        data: { childProfileId: child.id, language: "en", term: "DOG", normalizedTerm: "dog" },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("rejects invalid mission eligibility and vocabulary counters", async () => {
    await expect(
      prisma.mission.update({
        where: { code: "animal-adventure" },
        data: { minAge: 11, maxAge: 10 },
      }),
    ).rejects.toThrow(/Mission_age_range_check/);
    const user = await prisma.user.findUniqueOrThrow({
      where: { email: process.env.DEMO_USER_EMAIL ?? "demo@talkytown.local" },
    });
    const child = await prisma.childProfile.findUniqueOrThrow({
      where: { userId_alias: { userId: user.id, alias: "Leo" } },
    });
    await expect(
      prisma.vocabularyItem.update({
        where: {
          childProfileId_language_normalizedTerm: {
            childProfileId: child.id,
            language: "en",
            normalizedTerm: "dog",
          },
        },
        data: { successfulUseCount: 99 },
      }),
    ).rejects.toThrow(/VocabularyItem_counts_check/);
  });

  it("stores safety metadata and no provider secrets or progress duplicate", async () => {
    const columns = await prisma.$queryRaw<Array<{ table_name: string; column_name: string }>>`
      SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema() AND table_name IN ('SafetyEvent', 'AiProviderConfig', 'LearningProgress')
    `;
    expect(columns.some((column) => column.table_name === "LearningProgress")).toBe(false);
    const safety = columns
      .filter((column) => column.table_name === "SafetyEvent")
      .map((column) => column.column_name);
    expect(safety).toEqual(expect.arrayContaining(["category", "action"]));
    expect(safety).not.toContain("inputSnippet");
    const provider = columns
      .filter((column) => column.table_name === "AiProviderConfig")
      .map((column) => column.column_name);
    expect(provider.some((column) => /secret|key|token/i.test(column))).toBe(false);
  });
});
