import "reflect-metadata";
import { randomUUID } from "node:crypto";
import { Test } from "@nestjs/testing";
import { JwtService } from "@nestjs/jwt";
import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp } from "../src/configure-app";
import { PrismaService } from "../src/prisma/prisma.service";
import { AI_RUNTIME_POLICY } from "../src/config/ai-runtime-policy";
import { PersistenceIds } from "../src/common/persistence-ids.service";
import { fakeOpenAiServer } from "./helpers/fake-openai-server";
import { seedDemo } from "../prisma/seed-demo";
import { verifyDemoData } from "../prisma/seed-verification";
describe("real adapter with actual PostgreSQL", () => {
  let app: INestApplication;
  let db: PrismaService;
  let fake: Awaited<ReturnType<typeof fakeOpenAiServer>>;
  let userId: string;
  let childId: string;
  let token: string;
  const owners: string[] = [];
  const api = () => app.getHttpServer();
  const headers = () => ({ Authorization: "Bearer " + token });
  const configure = (baseUrl = fake.baseUrl, model = "first-model") =>
    request(api())
      .put("/ai-providers/local-openai-compatible/config")
      .set(headers())
      .send({ baseUrl, model });
  const activate = (providerType = "local-openai-compatible") =>
    request(api()).put("/ai-providers/active").set(headers()).send({ providerType });
  const start = async (guided = false) =>
    (
      await request(api())
        .post("/conversations/sessions")
        .set(headers())
        .send({
          requestId: randomUUID(),
          childProfileId: childId,
          mode: guided ? "guided-mission" : "free-talk",
          ...(guided ? { missionCode: "animal-adventure" } : {}),
        })
        .expect(201)
    ).body.session.id as string;
  const message = (id: string, text: string, requestId = randomUUID()) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .set(headers())
      .send({ requestId, message: text });
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
  });
  beforeEach(async () => {
    userId = (
      await db.user.create({
        data: { email: `phase5-${randomUUID()}@talkytown.local`, displayAlias: "Test Tutor" },
      })
    ).id;
    owners.push(userId);
    await db.aiProviderConfig.create({
      data: { userId, providerType: "mock", model: "talkytown-mock", isActive: true },
    });
    token = await app.get(JwtService).signAsync({ sub: userId, role: "adult" });
    childId = (
      await request(api())
        .post("/child-profiles")
        .set(headers())
        .send({
          alias: "DB Real Explorer",
          age: 9,
          nativeLanguage: "es",
          targetLanguage: "en",
          learningLevel: "hero",
          avatarCode: "luna",
        })
        .expect(201)
    ).body.id;
    fake.requests.length = 0;
    Object.assign(fake.state, {
      status: 200,
      invalid: false,
      invalidAttempts: 0,
      unsafe: false,
      delayMs: 0,
      onRequest: undefined,
    });
    fake.policy.localTimeoutMs = 1000;
    await configure().expect(200);
    await activate().expect(200);
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
  it("validates synthetic inference without storing it and persists a complete real-adapter mission", async () => {
    await request(api())
      .post("/ai-providers/local-openai-compatible/test")
      .set(headers())
      .expect(200);
    expect(
      await db.conversationTurn.count({ where: { session: { childProfileId: childId } } }),
    ).toBe(0);
    const id = await start(true);
    await message(id, "dog").expect(200);
    await message(id, "I likes dogs").expect(200);
    const requestId = randomUUID();
    const final = await message(id, "cat", requestId).expect(200);
    await message(id, "cat", requestId).expect(200);
    expect(final.body.session).toMatchObject({
      aiProviderType: "local-openai-compatible",
      aiModel: "first-model",
      missionProgress: 100,
      xpEarned: 45,
    });
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(7);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(4);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(2);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).level).toBe(
      "hero",
    );
    expect(
      (await db.xpEvent.aggregate({ where: { childProfileId: childId }, _sum: { amount: true } }))
        ._sum.amount,
    ).toBe(45);
    expect(fake.requests).toHaveLength(4);
  });
  it("keeps session runtime pinned while active/default model changes during an unlocked provider call", async () => {
    const id = await start();
    let entered!: () => void;
    let resume!: () => void;
    const ready = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const pending = new Promise<void>((resolve) => {
      resume = resolve;
    });
    fake.state.onRequest = async () => {
      entered();
      await pending;
    };
    const response = message(id, "dog").then((response) => response);
    await ready;
    try {
      await configure(fake.baseUrl, "second-model").expect(200);
      await activate("mock").expect(200);
    } finally {
      resume();
    }
    expect((await response).status).toBe(200);
    expect(fake.requests).toHaveLength(1);
    expect(fake.requests[0]!.body.model).toBe("first-model");
    expect((await db.conversationSession.findUniqueOrThrow({ where: { id } })).aiModel).toBe(
      "first-model",
    );
    expect(
      (await db.conversationSession.findUniqueOrThrow({ where: { id: await start() } }))
        .aiProviderType,
    ).toBe("mock");
  });
  it("only active owned sessions block base URL updates", async () => {
    const id = await start(true);
    await configure(fake.baseUrl.replace("/v1", "/other/v1"))
      .expect(409)
      .expect({ code: "PROVIDER_CONFIG_IN_USE", activeSessionCount: 1 });
    await message(id, "dog").expect(200);
    await message(id, "I like dogs").expect(200);
    await message(id, "cat").expect(200);
    const abandoned = await start();
    await request(api())
      .post(`/conversations/sessions/${abandoned}/end`)
      .set(headers())
      .expect(200);
    await configure(fake.baseUrl.replace("/v1", "/other/v1")).expect(200);
  });
  it("does not persist malformed, authentication or timeout failures; same request can succeed later", async () => {
    const id = await start();
    const requestId = randomUUID();
    fake.state.invalid = true;
    await message(id, "dog", requestId).expect(502).expect({ code: "PROVIDER_INVALID_RESPONSE" });
    fake.state.invalid = false;
    fake.state.status = 401;
    await message(id, "dog", requestId)
      .expect(502)
      .expect({ code: "PROVIDER_AUTHENTICATION_FAILED" });
    fake.state.status = 200;
    fake.state.delayMs = 100;
    fake.policy.localTimeoutMs = 20;
    await message(id, "dog", requestId).expect(504).expect({ code: "PROVIDER_TIMEOUT" });
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(1);
    expect(await db.vocabularyItem.count({ where: { childProfileId: childId } })).toBe(0);
    fake.state.delayMs = 0;
    fake.policy.localTimeoutMs = 1000;
    await message(id, "dog", requestId).expect(200);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(1);
  });
  it("rolls back rewards and vocabulary after persistence conflict following real inference", async () => {
    const id = await start();
    const operation = randomUUID();
    const opening = await db.conversationTurn.findFirstOrThrow({ where: { sessionId: id } });
    const ids = app.get(PersistenceIds);
    const real = ids.turn.bind(ids);
    const spy = vi
      .spyOn(ids, "turn")
      .mockImplementation((operation, role) =>
        role === "child" ? opening.id : real(operation, role),
      );
    await message(id, "dog", operation).expect(409);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.vocabularyItem.count({ where: { childProfileId: childId } })).toBe(0);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).xpTotal).toBe(0);
    spy.mockRestore();
    await message(id, "dog", operation).expect(200);
  });
  it("never sends/persists unsafe input and awards nothing for unsafe output", async () => {
    const id = await start();
    await message(id, "my phone is 612 345 678").expect(200);
    expect(fake.requests).toHaveLength(0);
    fake.state.unsafe = true;
    await message(id, "dog").expect(200);
    const turns = await db.conversationTurn.findMany({ where: { sessionId: id } });
    const safety = await db.safetyEvent.findMany({ where: { sessionId: id } });
    expect(JSON.stringify([turns, safety])).not.toContain("612");
    expect(turns.every((turn) => turn.role !== "child")).toBe(true);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
  });
  it("seed reruns preserve an adult's selected real provider", async () => {
    const previous = process.env.DEMO_USER_EMAIL;
    process.env.DEMO_USER_EMAIL = (
      await db.user.findUniqueOrThrow({ where: { id: userId } })
    ).email;
    try {
      await seedDemo(db);
      const first = await verifyDemoData(db);
      await seedDemo(db);
      expect(await verifyDemoData(db)).toEqual(first);
      const active = await db.aiProviderConfig.findMany({ where: { userId, isActive: true } });
      expect(active.map((config) => config.providerType)).toEqual(["local-openai-compatible"]);
    } finally {
      if (previous === undefined) delete process.env.DEMO_USER_EMAIL;
      else process.env.DEMO_USER_EMAIL = previous;
    }
  });
});
