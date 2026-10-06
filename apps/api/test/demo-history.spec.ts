import { demoProfiles, initialMissions } from "@talkytown/shared";
import { describe, expect, it } from "vitest";
import { demoSessions, getDemoSessionXp, getDemoVocabulary } from "../prisma/demo-history";

describe("demo history", () => {
  it("reconciles cached XP with historical rewards", () => {
    expect(demoSessions).toHaveLength(4);
    for (const profile of demoProfiles) {
      const total = demoSessions
        .filter((session) => session.alias === profile.alias)
        .reduce((xp, session) => xp + getDemoSessionXp(session), 0);
      expect(total).toBe(profile.xpTotal);
    }
  });

  it("keeps missions eligible for each demo child", () => {
    for (const session of demoSessions.filter((item) => item.missionCode)) {
      const profile = demoProfiles.find((item) => item.alias === session.alias);
      const mission = initialMissions.find((item) => item.code === session.missionCode);
      expect(profile).toBeDefined();
      expect(mission).toBeDefined();
      expect(profile?.age).toBeGreaterThanOrEqual(mission?.minAge ?? Infinity);
      expect(profile?.age).toBeLessThanOrEqual(mission?.maxAge ?? -Infinity);
      expect(session.completionXp).toBe(mission?.estimatedXp);
    }
  });

  it("counts child practice while excluding prompts and unsuccessful corrections", () => {
    const dog = getDemoVocabulary("Sofia").find((item) => item.term === "dog");
    expect(dog).toMatchObject({ practiceCount: 4, successfulUseCount: 3 });
    expect(dog?.firstSeenAt.toISOString()).toBe("2026-05-16T16:01:30.000Z");
    expect(dog?.lastPracticedAt.toISOString()).toBe("2026-05-17T16:01:30.000Z");
    expect(getDemoVocabulary("Leo").map((item) => item.term)).toEqual(["hello", "dog"]);
  });
});
