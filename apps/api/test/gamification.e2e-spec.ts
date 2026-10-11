import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationClock } from "../src/common/application-clock";
import { testApp } from "./helpers/test-app";

describe("Phase 7 gamification HTTP", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let token: string;
  let childId: string;
  let now: Date;
  const api = () => fixture.app.getHttpServer();
  const start = async (mode = "free-talk", missionCode?: string) =>
    (
      await request(api())
        .post("/conversations/sessions")
        .auth(token, { type: "bearer" })
        .send({ requestId: randomUUID(), childProfileId: childId, mode, missionCode })
        .expect(201)
    ).body.session.id as string;
  const send = (id: string, message = "hello", requestId = randomUUID()) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .auth(token, { type: "bearer" })
      .send({ requestId, message })
      .expect(200);
  const end = (id: string) =>
    request(api())
      .post(`/conversations/sessions/${id}/end`)
      .auth(token, { type: "bearer" })
      .expect(200);
  beforeEach(async () => {
    fixture = await testApp();
    now = new Date("2026-05-16T12:00:00Z");
    vi.spyOn(fixture.app.get(ApplicationClock), "now").mockImplementation(() => now);
    token = (await request(api()).post("/auth/demo").expect(200)).body.accessToken;
    childId = (
      await request(api())
        .post("/child-profiles")
        .auth(token, { type: "bearer" })
        .send({
          alias: "Moon Pilot",
          age: 9,
          nativeLanguage: "es",
          targetLanguage: "en",
          learningLevel: "hero",
          avatarCode: "luna",
        })
        .expect(201)
    ).body.id;
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.app.close();
  });
  it("installs a fresh catalog and awards exactly once from persisted corrections and practice", async () => {
    fixture.rows("badge").splice(0);
    const id = await start();
    const requestId = randomUUID();
    const first = await send(id, "I likes dogs", requestId);
    expect(first.body.awardedBadges.sort()).toEqual(["first-talk", "kind-corrector"]);
    expect(fixture.rows("badge")).toHaveLength(7);
    await send(id, "I likes dogs", requestId);
    expect(fixture.rows("childBadge")).toHaveLength(2);
    for (let i = 1; i < 10; i++) await send(id);
    expect(fixture.rows("childBadge").map((row) => row.badgeId)).toHaveLength(3);
    expect((await send(id)).body.awardedBadges).toEqual([]);
  });
  it("uses Madrid practice dates and preserves historical awards after a gap", async () => {
    const id = await start();
    for (const date of ["2026-05-16T21:59:00Z", "2026-05-16T22:01:00Z", "2026-05-17T22:01:00Z"]) {
      now = new Date(date);
      await send(id);
    }
    expect(fixture.rows("childProfile").find((row) => row.id === childId)?.streakDays).toBe(3);
    expect(fixture.rows("childBadge")).toHaveLength(2);
    now = new Date("2026-05-25T12:00:00Z");
    await send(id);
    expect(fixture.rows("childProfile").find((row) => row.id === childId)?.streakDays).toBe(1);
    expect(fixture.rows("childBadge")).toHaveLength(2);
  });
  it("counts completed guided sessions, including repeated missions", async () => {
    for (let i = 0; i < 3; i++) {
      const id = await start("guided-mission", "animal-adventure");
      await send(id, "dogs");
      await send(id, "I like dogs");
      const final = await send(id, "birds");
      if (i === 2) expect(final.body.awardedBadges).toContain("mission-hero");
    }
    expect(fixture.rows("childBadge")).toHaveLength(4);
    expect(fixture.rows("xpEvent").reduce((total, row) => total + Number(row.amount), 0)).toBe(135);
  });
  it("isolates a second adult's profile and rewards", async () => {
    const id = await start();
    await send(id);
    const { JwtService } = await import("@nestjs/jwt");
    const other = fixture.app.get(JwtService).sign({ sub: "other-adult", role: "adult" });
    await request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .auth(other, { type: "bearer" })
      .send({ requestId: randomUUID(), message: "hello" })
      .expect(404);
    expect(fixture.rows("childBadge")).toHaveLength(1);
    expect(fixture.rows("xpEvent")).toHaveLength(1);
  });
  it.each([0, 1, 2, 3, 4])(
    "closes free talk after %s events with stable reward semantics",
    async (count) => {
      const id = await start();
      for (let i = 0; i < count; i++) await send(id);
      await send(id, "123");
      const result = await end(id);
      expect(result.body).toMatchObject({
        status: count > 0 ? "completed" : "abandoned",
        xpEarned: count * 5 + (count >= 3 ? 10 : 0),
        completionRewardXp: count >= 3 ? 10 : 0,
      });
      expect((await end(id)).body).toEqual(result.body);
      expect(fixture.rows("xpEvent")).toHaveLength(count + Number(count >= 3));
    },
  );
  it("reports an already issued guided reward without granting more XP", async () => {
    const id = await start("guided-mission", "animal-adventure");
    await send(id, "dogs");
    await send(id, "I like dogs");
    await send(id, "cats");
    const result = await end(id);
    expect(result.body.completionRewardXp).toBe(30);
    expect((await end(id)).body).toEqual(result.body);
    expect(fixture.rows("xpEvent")).toHaveLength(4);
    const abandoned = await start("guided-mission", "animal-adventure");
    await send(abandoned, "dogs");
    expect((await end(abandoned)).body).toMatchObject({
      status: "abandoned",
      completionRewardXp: 0,
      xpEarned: 5,
    });
  });
  it("awards a guided completion that crosses Madrid midnight by one millisecond", async () => {
    const id = await start("guided-mission", "animal-adventure");
    await send(id, "dogs");
    await send(id, "I like dogs");
    now = new Date("2026-05-16T21:59:59.999Z");
    const completed = await send(id, "cats");
    expect(completed.body.session.endedAt).toBe("2026-05-16T22:00:00.000Z");
    expect(completed.body.awardedBadges.sort()).toEqual(["animal-explorer", "mission-complete"]);
    const badgeId = fixture.rows("badge").find((row) => row.code === "mission-complete")!.id;
    expect(fixture.rows("childBadge").find((row) => row.badgeId === badgeId)?.awardedAt).toEqual(
      new Date("2026-05-16T22:00:00Z"),
    );
  });
  it("derives consistent read-only profiles and progress after cached streaks expire", async () => {
    const id = await start();
    await send(id);
    fixture.rows("xpEvent")[0]!.amount = 55;
    fixture.rows("childProfile").find((row) => row.id === childId)!.xpTotal = 999;
    now = new Date("2026-05-20T12:00:00Z");
    const before = structuredClone({
      profiles: fixture.rows("childProfile"),
      awards: fixture.rows("childBadge"),
      xp: fixture.rows("xpEvent"),
      badges: fixture.rows("badge"),
    });
    const get = (path: string) =>
      request(api()).get(path).auth(token, { type: "bearer" }).expect(200);
    const progress = (await get(`/child-profiles/${childId}/progress`)).body;
    const detail = (await get(`/child-profiles/${childId}`)).body;
    const list = (await get("/child-profiles")).body.items[0];
    for (const result of [progress, detail, list])
      expect(result).toMatchObject({
        xpTotal: 55,
        gamificationLevel: 2,
        learningLevel: "hero",
        streakDays: 0,
      });
    expect(progress).toMatchObject({
      levelProgress: { xpIntoLevel: 5, xpToNextLevel: 45, xpPerLevel: 50 },
      practiceTimezone: "Europe/Madrid",
      lastPracticedAt: "2026-05-16T12:00:00.001Z",
    });
    expect(progress.badgeCatalog).toHaveLength(7);
    expect(
      progress.badgeCatalog.filter((badge: { unlocked: boolean }) => badge.unlocked),
    ).toHaveLength(1);
    expect(
      progress.badgeCatalog.find((badge: { code: string }) => badge.code === "mission-hero"),
    ).toMatchObject({ unlocked: false, awardedAt: null });
    expect({
      profiles: fixture.rows("childProfile"),
      awards: fixture.rows("childBadge"),
      xp: fixture.rows("xpEvent"),
      badges: fixture.rows("badge"),
    }).toEqual(before);
  });
  it("returns seven locked badges without initializing the database on a progress read", async () => {
    fixture.rows("badge").splice(0);
    const progress = await request(api())
      .get(`/child-profiles/${childId}/progress`)
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(progress.body.badgeCatalog).toHaveLength(7);
    expect(
      progress.body.badgeCatalog.every(
        (badge: { unlocked: boolean; awardedAt: null | string }) =>
          !badge.unlocked && badge.awardedAt === null,
      ),
    ).toBe(true);
    expect(fixture.rows("badge")).toHaveLength(0);
    expect(
      fixture.swagger.paths["/child-profiles/{id}/progress"]?.get?.responses["200"],
    ).toBeDefined();
  });
});
