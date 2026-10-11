import type { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { memoryPrisma } from "./helpers/memory-prisma";
import { reconcileGamification } from "../src/gamification/reconcile-gamification";
describe("historical gamification reconciliation", () => {
  it("previews without writes, applies earliest supported awards and repeats without changes", async () => {
    const memory = memoryPrisma();
    memory.rows("badge").splice(0);
    memory
      .rows("childProfile")
      .push({ id: "child", userId: "demo-adult", xpTotal: 999, streakDays: 99 });
    memory
      .rows("childProfile")
      .push({ id: "unrelated", userId: "other-adult", xpTotal: 0, streakDays: 0 });
    for (const [index, date] of [
      "2026-05-16T12:00:00Z",
      "2026-05-17T12:00:00Z",
      "2026-05-18T12:00:00Z",
    ].entries())
      memory.rows("xpEvent").push({
        id: `legacy-${index}`,
        childProfileId: "child",
        amount: 5,
        reason: "practice-turn",
        source: null,
        createdAt: new Date(date),
      });
    const db = memory.db as unknown as PrismaClient;
    const options = { childProfileId: "child", asOf: new Date("2026-05-25T12:00:00Z") };
    const before = structuredClone({
      profile: memory.rows("childProfile"),
      badge: memory.rows("badge"),
      awards: memory.rows("childBadge"),
      xp: memory.rows("xpEvent"),
    });
    const dry = await reconcileGamification(db, options);
    expect(dry.catalogChanges).toHaveLength(7);
    expect(dry.profiles[0]?.missingAwards.map((award) => award.code)).toEqual([
      "first-talk",
      "three-day-streak",
    ]);
    expect(dry.profiles[0]?.unlinkedPracticeEventIds).toHaveLength(3);
    expect({
      profile: memory.rows("childProfile"),
      badge: memory.rows("badge"),
      awards: memory.rows("childBadge"),
      xp: memory.rows("xpEvent"),
    }).toEqual(before);
    await reconcileGamification(db, { ...options, apply: true });
    expect(memory.rows("childBadge").map((award) => award.awardedAt)).toEqual([
      new Date("2026-05-16T12:00:00Z"),
      new Date("2026-05-18T12:00:00Z"),
    ]);
    const repeat = await reconcileGamification(db, { ...options, apply: true });
    expect(repeat.catalogChanges).toEqual([]);
    expect(repeat.profiles[0]).toMatchObject({
      profileCacheChanged: false,
      sessionCaches: [],
      missingAwards: [],
    });
    expect(memory.rows("xpEvent")).toEqual(before.xp);
    expect(memory.rows("childProfile")[1]).toEqual(before.profile[1]);
  });
  it("rejects an unknown scoped profile before catalog writes", async () => {
    const memory = memoryPrisma();
    memory.rows("badge").splice(0);
    await expect(
      reconcileGamification(memory.db as unknown as PrismaClient, {
        apply: true,
        childProfileId: "missing",
        asOf: new Date(),
      }),
    ).rejects.toThrow("PROFILE_NOT_FOUND");
    expect(memory.rows("badge")).toEqual([]);
  });
});
