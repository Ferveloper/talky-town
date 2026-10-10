import { randomUUID } from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MockAiProvider } from "@talkytown/ai-core";
import { testApp } from "./helpers/test-app";
describe("complete Phase 4 HTTP slice", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let token: string;
  let childId: string;
  const body = {
    alias: "Star Explorer",
    age: 9,
    nativeLanguage: "es",
    targetLanguage: "en",
    learningLevel: "hero",
    avatarCode: "luna",
  };
  const api = () => fixture.app.getHttpServer();
  const send = (
    sessionId: string,
    message: string,
    requestId: string = randomUUID(),
    inputMode = "text",
  ) =>
    request(api())
      .post("/conversations/sessions/" + sessionId + "/messages")
      .auth(token, { type: "bearer" })
      .send({ requestId, message, inputMode });
  const start = (mode = "guided-mission", missionCode?: string, requestId = randomUUID()) =>
    request(api())
      .post("/conversations/sessions")
      .auth(token, { type: "bearer" })
      .send({
        requestId,
        childProfileId: childId,
        mode,
        missionCode: mode === "guided-mission" ? (missionCode ?? "animal-adventure") : missionCode,
      });
  beforeEach(async () => {
    fixture = await testApp();
    token = (await request(api()).post("/auth/demo").expect(200)).body.accessToken;
    childId = (
      await request(api())
        .post("/child-profiles")
        .auth(token, { type: "bearer" })
        .send(body)
        .expect(201)
    ).body.id;
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.app.close();
  });
  it("completes mission, persists rewards, replays without duplication, exposes proficiency", async () => {
    const requestId = randomUUID();
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    const created = await start("guided-mission", "animal-adventure", requestId).expect(201);
    expect(mock).not.toHaveBeenCalled();
    const id = created.body.session.id;
    expect(created.body.session.avatarCode).toBe("luna");
    const replay = await start("guided-mission", "animal-adventure", requestId).expect(200);
    expect(replay.body.session.id).toBe(id);
    expect(fixture.rows("conversationSession")).toHaveLength(1);
    await start("guided-mission", "space-explorer", requestId).expect(409);
    const firstId = randomUUID();
    const first = await send(id, "dogs", firstId, "voice").expect(200);
    expect(first.body.session.missionProgress).toBe(33);
    expect(first.body.childTurn.inputMode).toBe("voice");
    expect(first.body.xpAwarded).toBe(5);
    await send(id, "dogs", firstId, "voice").expect(200);
    expect(fixture.rows("xpEvent")).toHaveLength(1);
    const second = await send(id, "I likes dogs").expect(200);
    expect(second.body.session.missionProgress).toBe(67);
    expect(second.body.childTurn.correction.needed).toBe(true);
    const finalId = randomUUID();
    const final = await send(id, "cats", finalId).expect(200);
    expect(final.body.session).toMatchObject({
      missionProgress: 100,
      status: "completed",
      xpEarned: 45,
    });
    expect(final.body.xpAwarded).toBe(35);
    expect(final.body.awardedBadges).toContain("animal-explorer");
    await send(id, "cats", finalId).expect(200);
    await send(id, "bird").expect(409);
    expect(fixture.rows("xpEvent")).toHaveLength(4);
    expect(fixture.rows("conversationTurn")).toHaveLength(7);
    const ended = await request(api())
      .post("/conversations/sessions/" + id + "/end")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(ended.body.xpEarned).toBe(45);
    const progress = await request(api())
      .get("/child-profiles/" + childId + "/progress")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(progress.body).toMatchObject({
      xpTotal: 45,
      learningLevel: "hero",
      completedSessions: 1,
      completedMissionCount: 1,
      completedMissionCodes: ["animal-adventure"],
    });
    expect(progress.body).not.toHaveProperty("level");
    expect(
      progress.body.vocabulary.find((term: { term: string }) => term.term === "dog"),
    ).toMatchObject({ practiceCount: 2, successfulUseCount: 1 });
    fixture.rows("childProfile")[0]!.xpTotal = 99999;
    const derived = await request(api())
      .get("/child-profiles/" + childId + "/progress")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(derived.body.xpTotal).toBe(45);
    expect(fixture.rows("childProfile")[0]!.level).toBe("hero");
    const history = await request(api())
      .get("/conversations/sessions/" + id + "/turns?limit=2")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(history.body.items).toHaveLength(2);
    const next = await request(api())
      .get("/conversations/sessions/" + id + "/turns")
      .query({ cursor: history.body.nextCursor, limit: 100 })
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(next.body.items).toHaveLength(5);
  });
  it("blocks unsafe raw input before provider/persistence, including retry", async () => {
    const id = (await start().expect(201)).body.session.id;
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    const requestId = randomUUID();
    const raw = "My phone number is 612 345 678";
    const result = await send(id, raw, requestId).expect(200);
    expect(result.body).toMatchObject({ childTurn: null, xpAwarded: 0, safety: { flagged: true } });
    expect(mock).not.toHaveBeenCalled();
    await send(id, raw, requestId).expect(200);
    expect(fixture.rows("safetyEvent")).toHaveLength(1);
    expect(fixture.rows("xpEvent")).toHaveLength(0);
    expect(fixture.rows("vocabularyItem")).toHaveLength(0);
    const turns = fixture
      .rows("conversationTurn")
      .map(({ content, correctedContent, correctionExplanation }) => ({
        content,
        correctedContent,
        correctionExplanation,
      }));
    const safety = fixture
      .rows("safetyEvent")
      .map(({ category, action, reason, severity }) => ({ category, action, reason, severity }));
    const responseContent = {
      childTurn: result.body.childTurn,
      reply: result.body.avatarTurn.content,
      safety: result.body.safety,
    };
    expect(JSON.stringify([turns, safety, responseContent])).not.toContain("612");
  });
  it("discards unsafe provider reply and correction before persistence", async () => {
    const id = (await start().expect(201)).body.session.id;
    vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply").mockResolvedValueOnce({
      reply: "my address is private",
      correction: { needed: true, corrected: "private@example.test" },
      newVocabulary: [],
      avatarEmotion: "happy",
      safety: { flagged: false },
    });
    const result = await send(id, "dog").expect(200);
    expect(result.body.safety.reason).toBe("unsafe-provider-output");
    expect(result.body.childTurn).toBeNull();
    expect(fixture.rows("xpEvent")).toHaveLength(0);
    expect(JSON.stringify(fixture.rows("conversationTurn"))).not.toContain("private");
  });
  it("rolls back every write when final avatar persistence fails", async () => {
    const id = (await start().expect(201)).body.session.id;
    const original = fixture.db.conversationTurn.create.bind(fixture.db.conversationTurn);
    const spy = vi.spyOn(fixture.db.conversationTurn, "create");
    spy.mockImplementation(((args: { data: { role: string } }) => {
      if (args.data.role === "avatar")
        return Promise.reject(new Error("injected persistence fault"));
      return original(args as never);
    }) as unknown as typeof fixture.db.conversationTurn.create);
    await send(id, "dog").expect(500).expect({ code: "INTERNAL_ERROR" });
    expect(fixture.rows("xpEvent")).toHaveLength(0);
    expect(fixture.rows("childBadge")).toHaveLength(0);
    expect(fixture.rows("vocabularyItem")).toHaveLength(0);
    expect(fixture.rows("conversationTurn")).toHaveLength(1);
    expect(fixture.rows("conversationSession")[0]!.missionProgress).toBe(0);
  });
  it("enforces ownership on all session actions", async () => {
    const id = (await start().expect(201)).body.session.id;
    token = await fixture.app.get(JwtService).signAsync({ sub: "other-adult", role: "adult" });
    await request(api())
      .get("/conversations/sessions/" + id)
      .auth(token, { type: "bearer" })
      .expect(404);
    await request(api())
      .get("/conversations/sessions/" + id + "/turns")
      .auth(token, { type: "bearer" })
      .expect(404);
    await send(id, "dog").expect(404);
    await request(api())
      .post("/conversations/sessions/" + id + "/end")
      .auth(token, { type: "bearer" })
      .expect(404);
    await start().expect(404);
  });
  it("rejects session avatar override and invalid mode/mission/input combinations", async () => {
    await request(api())
      .post("/conversations/sessions")
      .auth(token, { type: "bearer" })
      .send({
        requestId: randomUUID(),
        childProfileId: childId,
        mode: "free-talk",
        avatarCode: "luna",
      })
      .expect(400);
    await request(api())
      .post("/conversations/sessions")
      .auth(token, { type: "bearer" })
      .send({ requestId: randomUUID(), childProfileId: childId, mode: "guided-mission" })
      .expect(400);
    await start("free-talk", "animal-adventure").expect(400);
    await start("guided-mission", "meet-a-new-friend").expect(422);
    const id = (await start("free-talk", undefined).expect(201)).body.session.id;
    await send(id, "dog", randomUUID(), "audio").expect(400);
    await send(id, "dog", "invalid").expect(400);
    await send(id, " ".repeat(4)).expect(400);
  });
  it("ends empty sessions as abandoned and rejects bad/tampered/expired JWT", async () => {
    const id = (await start("free-talk", undefined).expect(201)).body.session.id;
    const end = await request(api())
      .post("/conversations/sessions/" + id + "/end")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(end.body.status).toBe("abandoned");
    await send(id, "dog").expect(409);
    await request(api())
      .get("/auth/me")
      .auth(token + "tamper", { type: "bearer" })
      .expect(401);
    const expired = await fixture.app
      .get(JwtService)
      .signAsync({ sub: "demo-adult", role: "adult" }, { expiresIn: -1 });
    await request(api()).get("/auth/me").auth(expired, { type: "bearer" }).expect(401);
    fixture.rows("user").splice(
      fixture.rows("user").findIndex((user) => user.id === "demo-adult"),
      1,
    );
    await request(api()).post("/auth/demo").expect(503);
  });
  it("Swagger contains every approved route and revised DTO fields", () => {
    for (const route of [
      "/auth/demo",
      "/auth/me",
      "/child-profiles",
      "/child-profiles/{id}",
      "/child-profiles/{id}/missions",
      "/child-profiles/{id}/progress",
      "/avatars",
      "/conversations/sessions",
      "/conversations/sessions/{id}",
      "/conversations/sessions/{id}/turns",
      "/conversations/sessions/{id}/messages",
      "/conversations/sessions/{id}/end",
      "/ai-providers",
      "/ai-providers/active",
    ])
      expect(fixture.swagger.paths).toHaveProperty(route);
    const schemas = fixture.swagger.components!.schemas!;
    expect(schemas.StartSessionDto).not.toHaveProperty("properties.avatarCode");
    expect(schemas.CreateChildProfileDto).toHaveProperty("properties.learningLevel");
  });
});
