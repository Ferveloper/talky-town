import "reflect-metadata";
import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MockAiProvider } from "@talkytown/ai-core";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { configureApp } from "../src/configure-app";
import { PersistenceIds } from "../src/common/persistence-ids.service";
describe("Phase 4 actual PostgreSQL vertical slice", () => {
  let app: INestApplication;
  let db: PrismaService;
  let userId: string;
  let otherId: string;
  let token: string;
  let outsider: string;
  const childIds: string[] = [];
  const api = () => app.getHttpServer();
  const headers = () => ({ Authorization: "Bearer " + token });
  async function child(age = 9) {
    const response = await request(api())
      .post("/child-profiles")
      .set(headers())
      .send({
        alias: "DB Explorer " + (childIds.length + 1),
        age,
        nativeLanguage: "es",
        targetLanguage: "en",
        learningLevel: "explorer",
        avatarCode: "luna",
      })
      .expect(201);
    childIds.push(response.body.id);
    return response.body.id as string;
  }
  async function session(childId: string, guided = true) {
    return (
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
  }
  const message = (id: string, text: string, requestId = randomUUID()) =>
    request(api())
      .post("/conversations/sessions/" + id + "/messages")
      .set(headers())
      .send({ requestId, message: text });
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(PrismaService);
    const suffix = randomUUID();
    userId = (
      await db.user.create({
        data: { email: "phase4-" + suffix + "@talkytown.local", displayAlias: "Test Tutor" },
      })
    ).id;
    otherId = (
      await db.user.create({
        data: {
          email: "phase4-other-" + suffix + "@talkytown.local",
          displayAlias: "Other Test Tutor",
        },
      })
    ).id;
    await db.aiProviderConfig.create({
      data: { userId, providerType: "mock", model: "talkytown-mock" },
    });
    token = await app.get(JwtService).signAsync({ sub: userId, role: "adult" });
    outsider = await app.get(JwtService).signAsync({ sub: otherId, role: "adult" });
  });
  afterEach(() => vi.restoreAllMocks());
  afterAll(async () => {
    if (db) {
      // Safety metadata otherwise survives cascading deletion with null references.
      await db.safetyEvent.deleteMany({ where: { childProfileId: { in: childIds } } });
      await db.aiProviderConfig.deleteMany({
        where: { userId: { in: [userId, otherId].filter(Boolean) } },
      });
      await db.user.deleteMany({ where: { id: { in: [userId, otherId].filter(Boolean) } } });
    }
    await app?.close();
  });
  it("persists actual turns, awards, vocabulary and ledger-derived progress", async () => {
    const childId = await child();
    const id = await session(childId);
    await message(id, "dog").expect(200);
    await message(id, "I likes dogs").expect(200);
    const finalRequest = randomUUID();
    const completed = await message(id, "cat", finalRequest).expect(200);
    expect(completed.body.session).toMatchObject({
      status: "completed",
      missionProgress: 100,
      xpEarned: 45,
    });
    await message(id, "cat", finalRequest).expect(200);
    const ledger = await db.xpEvent.aggregate({
      where: { childProfileId: childId },
      _sum: { amount: true },
    });
    expect(ledger._sum.amount).toBe(45);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(4);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(7);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(2);
    expect(
      await db.vocabularyItem.findUnique({
        where: {
          childProfileId_language_normalizedTerm: {
            childProfileId: childId,
            language: "en",
            normalizedTerm: "dog",
          },
        },
      }),
    ).toMatchObject({ practiceCount: 2, successfulUseCount: 1 });
    await db.childProfile.update({ where: { id: childId }, data: { xpTotal: 999 } });
    const progress = await request(api())
      .get("/child-profiles/" + childId + "/progress")
      .set(headers())
      .expect(200);
    expect(progress.body).toMatchObject({
      learningLevel: "explorer",
      xpTotal: 45,
      completedSessions: 1,
      completedMissionCount: 1,
    });
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).level).toBe(
      "explorer",
    );
    await request(api())
      .get("/child-profiles/" + childId + "/progress")
      .auth(outsider, { type: "bearer" })
      .expect(404);
    await request(api())
      .get("/conversations/sessions/" + id)
      .auth(outsider, { type: "bearer" })
      .expect(404);
  });
  it("deduplicates genuinely concurrent requests across PostgreSQL locks", async () => {
    const childId = await child();
    const id = await session(childId);
    const requestId = randomUUID();
    const responses = await Promise.all([
      message(id, "dog", requestId),
      message(id, "dog", requestId),
    ]);
    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(1);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(3);
    expect(
      (await db.vocabularyItem.findFirstOrThrow({ where: { childProfileId: childId } }))
        .practiceCount,
    ).toBe(1);
    const concurrent = await Promise.all([message(id, "I like dogs"), message(id, "I like dogs")]);
    expect(concurrent.every((response) => response.status === 200)).toBe(true);
    expect(
      (await db.conversationSession.findUniqueOrThrow({ where: { id } })).missionProgress,
    ).toBe(67);
    const closing = await Promise.all([message(id, "cat"), message(id, "bird")]);
    expect(closing.map((response) => response.status).sort()).toEqual([200, 409]);
    expect(await db.xpEvent.count({ where: { sessionId: id, reason: "mission-completed" } })).toBe(
      1,
    );
    const profile = await db.childProfile.findUniqueOrThrow({ where: { id: childId } });
    const xp = await db.xpEvent.aggregate({
      where: { childProfileId: childId },
      _sum: { amount: true },
    });
    expect(profile.xpTotal).toBe(xp._sum.amount);
  });
  it("serializes rewards across different sessions owned by same child", async () => {
    const childId = await child();
    const a = await session(childId, false);
    const b = await session(childId, false);
    const results = await Promise.all([message(a, "dog"), message(b, "cat")]);
    expect(results.every((response) => response.status === 200)).toBe(true);
    const profile = await db.childProfile.findUniqueOrThrow({ where: { id: childId } });
    expect(profile.xpTotal).toBe(10);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(1);
    expect((await db.conversationSession.findUniqueOrThrow({ where: { id: a } })).xpEarned).toBe(5);
    expect((await db.conversationSession.findUniqueOrThrow({ where: { id: b } })).xpEarned).toBe(5);
  });
  it("stores no unsafe raw input and replays safety result without duplicate event", async () => {
    const childId = await child();
    const id = await session(childId);
    const requestId = randomUUID();
    const spy = vi.spyOn(app.get(MockAiProvider), "generateConversationReply");
    const result = await message(id, "my phone is 612 345 678", requestId).expect(200);
    await message(id, "my phone is 612 345 678", requestId).expect(200);
    expect(spy).not.toHaveBeenCalled();
    expect(result.body.childTurn).toBeNull();
    expect(await db.safetyEvent.count({ where: { sessionId: id } })).toBe(1);
    const stored = await db.conversationTurn.findMany({ where: { sessionId: id } });
    const safety = await db.safetyEvent.findMany({ where: { sessionId: id } });
    expect(JSON.stringify([stored, safety])).not.toContain("612");
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
  });
  it("rolls back prior writes after real database unique violation, then accepts retry", async () => {
    const childId = await child();
    const id = await session(childId);
    const baseline = await db.conversationTurn.findFirstOrThrow({ where: { sessionId: id } });
    const spy = vi.spyOn(app.get(PersistenceIds), "turn");
    const original = spy.getMockImplementation();
    const real = PersistenceIds.prototype.turn.bind(app.get(PersistenceIds));
    spy.mockImplementation((operation, role) =>
      role === "child" ? baseline.id : real(operation, role),
    );
    const requestId = randomUUID();
    await message(id, "dog", requestId).expect(409);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(0);
    expect(await db.vocabularyItem.count({ where: { childProfileId: childId } })).toBe(0);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).xpTotal).toBe(0);
    expect(
      (await db.conversationSession.findUniqueOrThrow({ where: { id } })).missionProgress,
    ).toBe(0);
    expect(original).toBeUndefined();
    spy.mockRestore();
    await message(id, "dog", requestId).expect(200);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(1);
  });
  it("revalidates closed session after provider call outside transaction", async () => {
    const childId = await child();
    const id = await session(childId, false);
    let signal!: () => void;
    const entered = new Promise<void>((resolve) => {
      signal = resolve;
    });
    let finish!: () => void;
    const resume = new Promise<void>((resolve) => {
      finish = resolve;
    });
    vi.spyOn(app.get(MockAiProvider), "generateConversationReply").mockImplementationOnce(
      async () => {
        signal();
        await resume;
        return {
          reply: "Great job!",
          newVocabulary: [],
          avatarEmotion: "happy",
          safety: { flagged: false },
        };
      },
    );
    const pending = message(id, "dog").then((response) => response);
    await entered;
    // End can acquire locks while provider is pending, proving no provider-held DB transaction.
    const closed = await request(api())
      .post("/conversations/sessions/" + id + "/end")
      .set(headers())
      .expect(200);
    expect(closed.body.status).toBe("abandoned");
    finish();
    expect((await pending).status).toBe(409);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
  });
  it("revalidates provider selection after generation and never executes unsupported adapter", async () => {
    const childId = await child();
    const id = await session(childId);
    vi.spyOn(app.get(MockAiProvider), "generateConversationReply").mockImplementationOnce(
      async () => {
        await db.aiProviderConfig.updateMany({
          where: { userId },
          data: { providerType: "local-openai-compatible" },
        });
        return {
          reply: "Great job!",
          newVocabulary: [],
          avatarEmotion: "happy",
          safety: { flagged: false },
        };
      },
    );
    try {
      await message(id, "dog").expect(422).expect({ code: "PROVIDER_NOT_CONFIGURED" });
      expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    } finally {
      await db.aiProviderConfig.updateMany({ where: { userId }, data: { providerType: "mock" } });
    }
  });
});
