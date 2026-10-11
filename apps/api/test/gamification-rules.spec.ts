import { describe, expect, it } from "vitest";
import { levelProgress } from "../src/gamification/gamification-rules";
import { streakDays, threeDayAchievementAt } from "../src/gamification/streak-rules";
import { badgeEligibility, genuineCorrection } from "../src/gamification/badge-rules";
import { badgeCatalog, synchronizeBadgeCatalog } from "../src/gamification/badge-catalog";
import { memoryPrisma } from "./helpers/memory-prisma";
const practice = (...dates: string[]) =>
  dates.map((date) => ({ amount: 5, reason: "practice-turn", createdAt: new Date(date) }));
describe("Phase 7 pure rules and independent catalog", () => {
  it.each([
    [0, 1, 0],
    [49, 1, 49],
    [50, 2, 0],
    [99, 2, 49],
    [100, 3, 0],
    [149, 3, 49],
    [150, 4, 0],
  ])("derives level at %s XP", (xp, level, into) => {
    expect(levelProgress(xp)).toEqual({
      gamificationLevel: level,
      levelProgress: { xpIntoLevel: into, xpToNextLevel: 50 - into, xpPerLevel: 50 },
    });
  });
  it("counts days, preserves yesterday, resets after gap and ignores nonpractice", () => {
    const events = practice(
      "2026-05-16T12:00Z",
      "2026-05-16T20:00Z",
      "2026-05-17T12:00Z",
      "2026-05-18T12:00Z",
    );
    expect(streakDays([], new Date("2026-05-19T12:00Z"))).toBe(0);
    expect(streakDays(events, new Date("2026-05-18T13:00Z"))).toBe(3);
    expect(streakDays(events, new Date("2026-05-19T12:00Z"))).toBe(3);
    expect(streakDays(events, new Date("2026-05-20T12:00Z"))).toBe(0);
    expect(threeDayAchievementAt(events, new Date("2026-10-11T12:00Z"))).toEqual(
      new Date("2026-05-18T12:00Z"),
    );
    expect(
      streakDays(
        [
          { ...events[0]!, reason: "mission-completed" },
          { ...events[0]!, amount: 0 },
        ],
        new Date("2026-05-16T21:00Z"),
      ),
    ).toBe(0);
  });
  it.each([
    ["2026-01-31T12:00Z", "2026-02-01T12:00Z"],
    ["2026-12-31T12:00Z", "2027-01-01T12:00Z"],
    ["2028-02-28T12:00Z", "2028-02-29T12:00Z"],
    ["2026-03-28T23:00Z", "2026-03-29T22:00Z"],
    ["2026-10-24T22:00Z", "2026-10-25T23:00Z"],
  ])("uses calendar boundaries %s -> %s", (first, second) => {
    expect(streakDays(practice(first, second), new Date(second))).toBe(2);
  });
  it("handles midnight, repeated fall-back hour and future dates", () => {
    expect(
      streakDays(
        practice("2026-05-19T21:59:59Z", "2026-05-19T22:00Z"),
        new Date("2026-05-19T22:01Z"),
      ),
    ).toBe(2);
    expect(
      streakDays(practice("2026-10-25T00:30Z", "2026-10-25T01:30Z"), new Date("2026-10-25T12:00Z")),
    ).toBe(1);
    expect(streakDays(practice("2026-05-20T12:00Z"), new Date("2026-05-19T12:00Z"))).toBe(0);
  });
  it("uses accepted event counts and repeated guided sessions, not XP thresholds", () => {
    const events = practice(...Array<string>(10).fill("2026-05-18T12:00Z"));
    events[0]!.amount = 100;
    const evidence = {
      practice: events,
      corrections: [new Date("2026-05-18T12:00Z")],
      guided: [1, 2, 3].map((id) => ({
        id: String(id),
        missionCode: "animal-adventure",
        endedAt: new Date("2026-05-18T12:00Z"),
      })),
    };
    const earned = badgeEligibility(evidence, new Date("2026-05-19T12:00Z"));
    expect(Object.values(earned).filter(Boolean)).toHaveLength(6);
    expect(
      badgeEligibility(
        { ...evidence, practice: events.slice(0, 9), guided: evidence.guided.slice(0, 2) },
        new Date("2026-05-19T12:00Z"),
      )["brave-speaker"],
    ).toBeUndefined();
    expect(genuineCorrection(" I   like dogs ", "I like dogs")).toBe(false);
    expect(genuineCorrection("I likes dogs", "I like dogs")).toBe(true);
    expect(genuineCorrection("dog", null)).toBe(false);
  });
  it("installs fresh catalog, repeats without changes and preserves awards/profiles", async () => {
    const memory = memoryPrisma();
    memory.rows("badge").splice(0);
    expect(await synchronizeBadgeCatalog(memory.db)).toHaveLength(7);
    const first = structuredClone(memory.rows("badge"));
    expect(await synchronizeBadgeCatalog(memory.db)).toEqual([]);
    expect(memory.rows("badge")).toEqual(first);
    memory.rows("childBadge").push({
      id: "award",
      childProfileId: "owned",
      badgeId: first[0]!.id,
      source: "runtime",
      awardedAt: new Date("2026-05-18T12:00Z"),
    });
    const awards = structuredClone(memory.rows("childBadge"));
    memory.rows("badge")[0]!.description = "old description";
    expect(await synchronizeBadgeCatalog(memory.db)).toEqual([badgeCatalog[0]!.code]);
    expect(memory.rows("childBadge")).toEqual(awards);
    expect(memory.rows("childProfile")).toEqual([]);
  });
});
