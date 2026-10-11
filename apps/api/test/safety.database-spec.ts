import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import type { INestApplication } from "@nestjs/common";
import type { AiConversationResponse } from "@talkytown/ai-core";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { AI_RUNTIME_POLICY } from "../src/config/ai-runtime-policy";
import { PersistenceIds } from "../src/common/persistence-ids.service";
import { ConversationStoreService } from "../src/conversations/conversation-store.service";
import { safetyResponse } from "../src/safety/safety-responses";
import { fakeOpenAiServer } from "./helpers/fake-openai-server";
import {
  blockedFixtures,
  reviewedAllowedFixtures,
  reviewedDisclosureFixtures,
  reviewedProviderFixtures,
} from "./helpers/safety-fixtures";

const safe: AiConversationResponse = {
  reply: "Great practice!",
  newVocabulary: [],
  avatarEmotion: "encouraging",
  safety: { flagged: false },
};
describe("Phase 6 actual PostgreSQL safety invariants", () => {
  let app: INestApplication;
  let db: PrismaService;
  let fake: Awaited<ReturnType<typeof fakeOpenAiServer>>;
  let userId: string;
  let childId: string;
  let token: string;
  let outsider: string;
  const owners: string[] = [];
  const api = () => app.getHttpServer();
  const auth = () => ({ Authorization: "Bearer " + token });
  const start = (requestId = randomUUID()) =>
    request(api()).post("/conversations/sessions").set(auth()).send({
      requestId,
      childProfileId: childId,
      mode: "guided-mission",
      missionCode: "animal-adventure",
    });
  const send = (id: string, message: string, requestId = randomUUID()) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .set(auth())
      .send({ requestId, message });
  beforeAll(async () => {
    fake = await fakeOpenAiServer();
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AI_RUNTIME_POLICY)
      .useValue(fake.policy)
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(PrismaService);
    const other = await db.user.create({
      data: {
        email: `phase6-other-${randomUUID()}@talkytown.local`,
        displayAlias: "Other Test Tutor",
      },
    });
    owners.push(other.id);
    outsider = await app.get(JwtService).signAsync({ sub: other.id, role: "adult" });
  });
  beforeEach(async () => {
    const adult = await db.user.create({
      data: { email: `phase6-${randomUUID()}@talkytown.local`, displayAlias: "Test Tutor" },
    });
    userId = adult.id;
    owners.push(userId);
    await db.aiProviderConfig.create({
      data: { userId, providerType: "mock", model: "talkytown-mock" },
    });
    token = await app.get(JwtService).signAsync({ sub: userId, role: "adult" });
    childId = (
      await request(api())
        .post("/child-profiles")
        .set(auth())
        .send({
          alias: "DB Safety Explorer",
          age: 9,
          nativeLanguage: "es",
          targetLanguage: "en",
          learningLevel: "explorer",
          avatarCode: "luna",
        })
        .expect(201)
    ).body.id;
    fake.requests.length = 0;
    fake.state.response = undefined;
    await request(api())
      .put("/ai-providers/local-openai-compatible/config")
      .set(auth())
      .send({ baseUrl: fake.baseUrl, model: "safety-test-model" })
      .expect(200);
    await request(api())
      .put("/ai-providers/active")
      .set(auth())
      .send({ providerType: "local-openai-compatible" })
      .expect(200);
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (db && owners.length) {
      const children = await db.childProfile.findMany({
        where: { userId: { in: owners } },
        select: { id: true },
      });
      await db.safetyEvent.deleteMany({
        where: { childProfileId: { in: children.map((child) => child.id) } },
      });
      await db.aiProviderConfig.deleteMany({ where: { userId: { in: owners } } });
      await db.user.deleteMany({ where: { id: { in: owners } } });
    }
    await app?.close();
    await fake?.close();
  });
  async function learningState(id: string) {
    return {
      profile: await db.childProfile.findUniqueOrThrow({ where: { id: childId } }),
      session: await db.conversationSession.findUniqueOrThrow({ where: { id } }),
      xp: await db.xpEvent.findMany({ where: { childProfileId: childId }, orderBy: { id: "asc" } }),
      vocabulary: await db.vocabularyItem.findMany({
        where: { childProfileId: childId },
        orderBy: { id: "asc" },
      }),
      badges: await db.childBadge.findMany({
        where: { childProfileId: childId },
        orderBy: { id: "asc" },
      }),
    };
  }
  it.each(blockedFixtures)(
    "blocks $id with only coded auditing and a controlled turn",
    async ({ text, reason, support }) => {
      const id = (await start().expect(201)).body.session.id;
      const before = await learningState(id);
      const requestId = randomUUID();
      const result = await send(id, text, requestId).expect(200);
      const replay = await send(id, text, requestId).expect(200);
      expect(replay.body).toEqual(result.body);
      expect(result.body).toMatchObject({
        childTurn: null,
        xpAwarded: 0,
        practicedVocabulary: [],
        awardedBadges: [],
        safety: { flagged: true, reason },
      });
      expect(fake.requests).toHaveLength(0);
      expect(await learningState(id)).toEqual(before);
      const events = await db.safetyEvent.findMany({
        where: { sessionId: id },
        select: { category: true, reason: true, severity: true, action: true },
      });
      expect(events).toHaveLength(1);
      expect(JSON.stringify(events)).not.toContain(text);
      if (support) {
        expect(result.body.avatarTurn.content).toBe(safetyResponse(support, "8-10"));
        expect(events[0]).toEqual({
          category: "wellbeing",
          reason,
          severity: support === "self-harm" ? "critical" : "warning",
          action: "support",
        });
      }
      const turns = await db.conversationTurn.findMany({
        where: { sessionId: id },
        select: { role: true, content: true, correctedContent: true, correctionExplanation: true },
      });
      expect(turns).toHaveLength(2);
      expect(turns.every((turn) => turn.role === "avatar")).toBe(true);
      expect(JSON.stringify(turns)).not.toContain(text);
    },
  );
  it.each(reviewedAllowedFixtures)("accepts benign child and provider $id", async ({ text }) => {
    const id = (await start().expect(201)).body.session.id;
    fake.state.response = { ...safe, reply: text };
    const result = await send(id, text).expect(200);
    expect(result.body.safety).toEqual({ flagged: false });
    expect(result.body.childTurn.content).toBe(text);
    expect(result.body.avatarTurn.content).toBe(text);
    expect(result.body.xpAwarded).toBe(5);
    expect(fake.requests).toHaveLength(1);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(1);
  });
  it.each([
    { id: "reply", response: { ...safe, reply: "What is your name?" } },
    {
      id: "corrected",
      response: {
        ...safe,
        correction: { needed: true as const, corrected: "My address is 12 Blue Street" },
      },
    },
    {
      id: "explanation",
      response: {
        ...safe,
        correction: { needed: true as const, corrected: "dog", explanation: "Send me a photo" },
      },
    },
    { id: "vocabulary", response: { ...safe, newVocabulary: ["child@example.test"] } },
    {
      id: "split-vocabulary",
      response: { ...safe, newVocabulary: ["child", "@", "example.test"] },
    },
    { id: "provider-self-harm", response: { ...safe, reply: "I want to die" } },
    {
      id: "provider-flag",
      response: { ...safe, safety: { flagged: true as const, reason: "other" as const } },
    },
    ...[...reviewedProviderFixtures, ...reviewedDisclosureFixtures].map(({ id, text }) => ({
      id,
      response: { ...safe, reply: text },
    })),
  ])(
    "discards generated $id through the actual adapter/schema and PostgreSQL",
    async ({ response }) => {
      const id = (await start().expect(201)).body.session.id;
      const before = await learningState(id);
      fake.state.response = response;
      const requestId = randomUUID();
      const result = await send(id, "dog", requestId).expect(200);
      const replay = await send(id, "dog", requestId).expect(200);
      expect(replay.body).toEqual(result.body);
      expect(result.body).toMatchObject({
        childTurn: null,
        xpAwarded: 0,
        practicedVocabulary: [],
        awardedBadges: [],
        safety: { flagged: true, reason: "unsafe-provider-output" },
      });
      expect(result.body.avatarTurn.content).toBe(safetyResponse("redirect", "8-10"));
      expect(await learningState(id)).toEqual(before);
      expect(fake.requests).toHaveLength(1);
      expect(await db.safetyEvent.findFirstOrThrow({ where: { sessionId: id } })).toMatchObject({
        category: "provider-output",
        reason: "unsafe-provider-output",
        action: "redirect",
      });
      expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(1);
      const turns = await db.conversationTurn.findMany({ where: { sessionId: id } });
      expect(turns).toHaveLength(2);
      expect(
        turns.every(
          (turn) => turn.role === "avatar" && !turn.correctedContent && !turn.correctionExplanation,
        ),
      ).toBe(true);
      expect(JSON.stringify(turns)).not.toContain(response.reply);
    },
  );
  it("deduplicates concurrent blocked requests and retries distinct stale snapshots", async () => {
    const id = (await start().expect(201)).body.session.id;
    const requestId = randomUUID();
    const concurrent = await Promise.all([
      send(id, "I want to die", requestId),
      send(id, "I want to die", requestId),
    ]);
    expect(concurrent.map((result) => result.status)).toEqual([200, 200]);
    expect(concurrent[0]!.body).toEqual(concurrent[1]!.body);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(1);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(2);
    const different = await Promise.all([send(id, "They bully me"), send(id, "Be my girlfriend")]);
    expect(different.map((result) => result.status)).toEqual([200, 200]);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(3);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(fake.requests).toHaveLength(0);
  });
  it("rolls back safety auditing when avatar persistence fails, then permits the same request", async () => {
    const opened = await start().expect(201);
    const id = opened.body.session.id;
    const ids = app.get(PersistenceIds);
    const original = ids.turn.bind(ids);
    let avatarCalls = 0;
    // Two replay lookups must keep their real IDs; collide only on the actual write.
    const spy = vi
      .spyOn(ids, "turn")
      .mockImplementation((operation, role) =>
        role === "avatar" && ++avatarCalls === 3
          ? opened.body.openingTurn.id
          : original(operation, role),
      );
    const requestId = randomUUID();
    await send(id, "I want to die", requestId).expect(409);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(1);
    spy.mockRestore();
    await send(id, "I want to die", requestId).expect(200);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(1);
  });
  it("protects near-complete mission rewards against input/output blocking", async () => {
    const id = (await start().expect(201)).body.session.id;
    await send(id, "dog").expect(200);
    await send(id, "I like dogs").expect(200);
    const before = await learningState(id);
    await send(id, "cat my phone is 612345678").expect(200);
    fake.state.response = { ...safe, reply: "I want to die" };
    await send(id, "cat").expect(200);
    expect(await learningState(id)).toEqual(before);
    fake.state.response = undefined;
    const result = await send(id, "cat").expect(200);
    expect(result.body.session).toMatchObject({ missionProgress: 100, xpEarned: 45 });
    expect(result.body.awardedBadges).toContain("animal-explorer");
  });
  it("filters newly unsafe history only for providers, preserving projected and transactional missions", async () => {
    const opened = await start().expect(201);
    const id = opened.body.session.id;
    const firstRequest = randomUUID();
    const first = await send(id, "dog", firstRequest).expect(200);
    const legacy = "dog You are my only friend";
    await db.conversationTurn.update({
      where: { id: first.body.childTurn.id },
      data: { content: legacy },
    });
    const before = await learningState(id);
    await send(id, "dog", firstRequest).expect(409).expect({ code: "SAFETY_REVIEW_REQUIRED" });
    await request(api()).get(`/conversations/sessions/${id}/turns`).set(auth()).expect(409);
    expect(await learningState(id)).toEqual(before);
    fake.requests.length = 0;
    expect((await send(id, "I like cats").expect(200)).body.session.missionProgress).toBe(67);
    expect((await send(id, "dog").expect(200)).body.session.missionProgress).toBe(67);
    expect(fake.requests[1]!.body.messages[0]!.content).toContain(
      "Next server-provided tutor instruction: Name a different animal.",
    );
    const finalRequest = randomUUID();
    const completed = await send(id, "cat", finalRequest).expect(200);
    await send(id, "cat", finalRequest).expect(200);
    expect(completed.body.session).toMatchObject({
      status: "completed",
      missionProgress: 100,
      xpEarned: 50,
    });
    expect(completed.body.awardedBadges).toContain("animal-explorer");
    expect(JSON.stringify(fake.requests)).not.toContain(legacy);
    expect(await db.xpEvent.count({ where: { sessionId: id, reason: "mission-completed" } })).toBe(
      1,
    );
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).xpTotal).toBe(50);
  });
  it("restricts historical alias exposure to its owner without breaking known-ID operations", async () => {
    await db.childProfile.update({ where: { id: childId }, data: { alias: "Explorer 612345678" } });
    await request(api())
      .get("/child-profiles")
      .set(auth())
      .expect(409)
      .expect({ code: "SAFETY_REVIEW_REQUIRED" });
    await request(api()).get(`/child-profiles/${childId}`).set(auth()).expect(409);
    await request(api())
      .get(`/child-profiles/${childId}`)
      .auth(outsider, { type: "bearer" })
      .expect(404);
    await request(api())
      .get("/child-profiles")
      .auth(outsider, { type: "bearer" })
      .expect(200)
      .expect({ items: [] });
    const id = (await start().expect(201)).body.session.id;
    await send(id, "dog").expect(200);
    expect(JSON.stringify(fake.requests)).not.toContain("Explorer 612345678");
    await request(api()).get(`/conversations/sessions/${id}`).set(auth()).expect(200);
    await request(api()).get(`/child-profiles/${childId}/progress`).set(auth()).expect(200);
    await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
    await send(id, "dog").auth(outsider, { type: "bearer" }).expect(404);
    const beforeRecovery = await learningState(id);
    await db.childProfile.updateMany({
      where: { id: childId, userId },
      data: { alias: "Recovered Explorer" },
    });
    await request(api()).get(`/child-profiles/${childId}`).set(auth()).expect(200);
    await request(api()).get("/child-profiles").set(auth()).expect(200);
    const afterRecovery = await learningState(id);
    expect(afterRecovery.xp).toEqual(beforeRecovery.xp);
    expect(afterRecovery.session).toEqual(beforeRecovery.session);
    expect(afterRecovery.vocabulary).toEqual(beforeRecovery.vocabulary);
    expect(afterRecovery.badges).toEqual(beforeRecovery.badges);
  });
  it.each(["content", "correctedContent", "correctionExplanation"] as const)(
    "guards historical %s independent of correctionNeeded",
    async (field) => {
      const openingRequest = randomUUID();
      const opened = await start(openingRequest).expect(201);
      const id = opened.body.session.id;
      const requestId = randomUUID();
      const result = await send(id, "dog", requestId).expect(200);
      await db.conversationTurn.update({
        where: { id: result.body.childTurn.id },
        data: { [field]: "child@example.test", correctionNeeded: false },
      });
      const before = await learningState(id);
      await request(api()).get(`/conversations/sessions/${id}/turns`).set(auth()).expect(409);
      await send(id, "dog", requestId).expect(409);
      expect(await learningState(id)).toEqual(before);
      await db.conversationTurn.update({
        where: { id: opened.body.openingTurn.id },
        data: { content: "What is your phone number?" },
      });
      await start(openingRequest).expect(409).expect({ code: "SAFETY_REVIEW_REQUIRED" });
      await request(api()).get(`/conversations/sessions/${id}`).set(auth()).expect(200);
      await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
    },
  );
  it("discards a mismatched correction original through the strict real parser with no writes", async () => {
    const id = (await start().expect(201)).body.session.id;
    const before = await learningState(id);
    fake.state.response = {
      ...safe,
      correction: { needed: true, original: "child@example.test", corrected: "dog" },
    };
    await send(id, "dog").expect(502).expect({ code: "PROVIDER_INVALID_RESPONSE" });
    expect(fake.requests).toHaveLength(2);
    expect(await learningState(id)).toEqual(before);
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(1);
  });
  it("reviews returned persistence results after commit and never repeats committed rewards", async () => {
    const id = (await start().expect(201)).body.session.id;
    const store = app.get(ConversationStoreService);
    const original = store.persist.bind(store);
    vi.spyOn(store, "persist").mockImplementation(async (...args) => {
      const result = await original(...args);
      await db.conversationTurn.update({
        where: { id: result.avatarTurn.id },
        data: { content: "What is your phone number?" },
      });
      return (await store.replay(args[0], args[1], args[2]))!;
    });
    const requestId = randomUUID();
    await send(id, "dog", requestId).expect(409);
    await send(id, "dog", requestId).expect(409);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(1);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(3);
    expect(fake.requests).toHaveLength(1);
  });
});
