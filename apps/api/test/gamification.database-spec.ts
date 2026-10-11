import "reflect-metadata";
import { randomUUID } from "node:crypto";
import type { INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { configureApp } from "../src/configure-app";
import { ApplicationClock } from "../src/common/application-clock";
import { PersistenceIds } from "../src/common/persistence-ids.service";
import { GamificationService } from "../src/gamification/gamification.service";
import { synchronizeBadgeCatalog } from "../src/gamification/badge-catalog";
import { reconcileGamification } from "../src/gamification/reconcile-gamification";
import { seedDemo } from "../prisma/seed-demo";
import { verifyDemoData } from "../prisma/seed-verification";

describe("Phase 7 PostgreSQL atomic rewards and seed preservation", () => {
  let app: INestApplication;
  let db: PrismaService;
  let userId: string;
  let token: string;
  const users: string[] = [];
  let next = 0;
  const asOf = new Date("2026-10-11T10:00:00Z");
  let clockTime = asOf;
  const api = () => app.getHttpServer();
  const send = (id: string, message = "hello", requestId = randomUUID()) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .auth(token, { type: "bearer" })
      .send({ requestId, message });
  const end = (id: string) =>
    request(api()).post(`/conversations/sessions/${id}/end`).auth(token, { type: "bearer" });
  const child = async (alias = `DB Pilot ${++next}`) =>
    (
      await request(api())
        .post("/child-profiles")
        .auth(token, { type: "bearer" })
        .send({
          alias,
          age: 9,
          nativeLanguage: "es",
          targetLanguage: "en",
          learningLevel: "hero",
          avatarCode: "luna",
        })
        .expect(201)
    ).body.id as string;
  const start = async (childProfileId: string) =>
    (
      await request(api())
        .post("/conversations/sessions")
        .auth(token, { type: "bearer" })
        .send({ requestId: randomUUID(), childProfileId, mode: "free-talk" })
        .expect(201)
    ).body.session.id as string;
  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ApplicationClock)
      .useValue({ now: () => clockTime })
      .compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
    db = app.get(PrismaService);
    const user = await db.user.create({
      data: { email: `phase7-${randomUUID()}@talkytown.local`, displayAlias: "Test Tutor" },
    });
    userId = user.id;
    users.push(userId);
    await db.aiProviderConfig.create({
      data: { userId, providerType: "mock", model: "talkytown-mock" },
    });
    token = app.get(JwtService).sign({ sub: userId, role: "adult" });
  });
  afterEach(() => {
    vi.restoreAllMocks();
    clockTime = asOf;
  });
  afterAll(async () => {
    if (db) {
      await db.safetyEvent.deleteMany({ where: { childProfile: { userId: { in: users } } } });
      await db.user.deleteMany({ where: { id: { in: users } } });
    }
    await app?.close();
  });
  it("serializes concurrent ends and replays a stable atomic completion reward", async () => {
    const childId = await child();
    const id = await start(childId);
    for (let i = 0; i < 3; i++) await send(id).expect(200);
    const [first, second] = await Promise.all([end(id).expect(200), end(id).expect(200)]);
    expect(first.body).toEqual(second.body);
    expect(first.body).toMatchObject({ xpEarned: 25, completionRewardXp: 10, status: "completed" });
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(4);
    expect(
      await db.xpEvent.count({ where: { sessionId: id, reason: "free-talk-completed" } }),
    ).toBe(1);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).xpTotal).toBe(25);
  });
  it("awards one threshold badge across concurrent sessions of the same profile", async () => {
    const childId = await child();
    const first = await start(childId);
    const second = await start(childId);
    for (let i = 0; i < 8; i++) await send(first).expect(200);
    const results = await Promise.all([send(first).expect(200), send(second).expect(200)]);
    expect(results.flatMap((result) => result.body.awardedBadges)).toEqual(["brave-speaker"]);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(2);
    expect(await db.xpEvent.count({ where: { childProfileId: childId } })).toBe(10);
  });
  it("rolls back accepted evidence and XP after an award transaction failure", async () => {
    const childId = await child();
    const id = await start(childId);
    const requestId = randomUUID();
    const service = app.get(GamificationService);
    const award = service.award.bind(service);
    vi.spyOn(service, "award").mockImplementationOnce(async (tx, input) => {
      await award(tx, input);
      throw new Error("Controlled post-award failure");
    });
    await send(id, "hello", requestId).expect(500);
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(0);
    expect(await db.conversationTurn.count({ where: { sessionId: id } })).toBe(1);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(0);
    vi.restoreAllMocks();
    expect((await send(id, "hello", requestId).expect(200)).body.awardedBadges).toEqual([
      "first-talk",
    ]);
  });
  it("allows end while generation is pending and prevents a late third event or bonus", async () => {
    const childId = await child();
    const id = await start(childId);
    await send(id).expect(200);
    await send(id).expect(200);
    const { MockAiProvider } = await import("@talkytown/ai-core");
    let entered!: () => void;
    let resume!: () => void;
    const generating = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const released = new Promise<void>((resolve) => {
      resume = resolve;
    });
    const provider = app.get(MockAiProvider);
    const original = provider.generateConversationReply.bind(provider);
    vi.spyOn(provider, "generateConversationReply").mockImplementationOnce(async (input) => {
      entered();
      await released;
      return original(input);
    });
    const pending = send(id).then((result) => result);
    await generating;
    const result = await end(id).expect(200);
    resume();
    expect((await pending).status).toBe(409);
    expect(result.body).toMatchObject({ status: "completed", completionRewardXp: 0, xpEarned: 10 });
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(2);
  });
  it("runs the deterministic Mock walkthrough for all seven badges and level/streak progress", async () => {
    const childId = await child();
    for (let day = 16; day <= 18; day++) {
      clockTime = new Date(`2026-05-${day}T12:00:00Z`);
      const id = (
        await request(api())
          .post("/conversations/sessions")
          .auth(token, { type: "bearer" })
          .send({
            requestId: randomUUID(),
            childProfileId: childId,
            mode: "guided-mission",
            missionCode: "animal-adventure",
          })
          .expect(201)
      ).body.session.id;
      await send(id, "dogs").expect(200);
      await send(id, day === 16 ? "I likes dogs" : "I like dogs").expect(200);
      expect((await send(id, "cats").expect(200)).body.session).toMatchObject({
        status: "completed",
        xpEarned: 45,
        aiProviderType: "mock",
      });
      expect((await end(id).expect(200)).body.completionRewardXp).toBe(30);
    }
    const free = await start(childId);
    for (let i = 0; i < 3; i++) await send(free).expect(200);
    const ended = await end(free).expect(200);
    expect(ended.body).toMatchObject({ xpEarned: 25, completionRewardXp: 10 });
    expect((await end(free).expect(200)).body).toEqual(ended.body);
    const progress = (
      await request(api())
        .get(`/child-profiles/${childId}/progress`)
        .auth(token, { type: "bearer" })
        .expect(200)
    ).body;
    expect(progress).toMatchObject({
      xpTotal: 160,
      gamificationLevel: 4,
      learningLevel: "hero",
      streakDays: 3,
      levelProgress: { xpIntoLevel: 10, xpToNextLevel: 40, xpPerLevel: 50 },
      completedSessions: 4,
      completedMissionCount: 1,
    });
    expect(progress.badges).toHaveLength(7);
    expect(progress.badgeCatalog.every((badge: { unlocked: boolean }) => badge.unlocked)).toBe(
      true,
    );
    expect(await db.xpEvent.count({ where: { childProfileId: childId } })).toBe(16);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(7);
  });
  it("rolls back a failed completion event before closing the session", async () => {
    const childId = await child();
    const id = await start(childId);
    for (let i = 0; i < 3; i++) await send(id).expect(200);
    const event = await db.xpEvent.findFirstOrThrow({ where: { sessionId: id } });
    vi.spyOn(app.get(PersistenceIds), "completionXp").mockReturnValue(event.id);
    await end(id).expect(409);
    expect((await db.conversationSession.findUniqueOrThrow({ where: { id } })).status).toBe(
      "active",
    );
    expect(await db.xpEvent.count({ where: { sessionId: id } })).toBe(3);
    expect((await db.childProfile.findUniqueOrThrow({ where: { id: childId } })).xpTotal).toBe(15);
    vi.restoreAllMocks();
    expect((await end(id).expect(200)).body.completionRewardXp).toBe(10);
  });
  it("keeps late historical eligibility explicit and reconciles without creating XP", async () => {
    const childId = await child();
    const id = await start(childId);
    await db.xpEvent.create({
      data: {
        id: randomUUID(),
        childProfileId: childId,
        sessionId: id,
        amount: 5,
        reason: "practice-turn",
        createdAt: new Date("2026-05-16T12:00:00Z"),
      },
    });
    expect((await send(id).expect(200)).body.awardedBadges).toEqual([]);
    const xpBefore = await db.xpEvent.findMany({
      where: { childProfileId: childId },
      orderBy: { id: "asc" },
    });
    const preview = await reconcileGamification(db, { childProfileId: childId, asOf });
    expect(preview.profiles[0]?.missingAwards).toEqual([
      { code: "first-talk", awardedAt: "2026-05-16T12:00:00.000Z" },
    ]);
    expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(0);
    await reconcileGamification(db, { childProfileId: childId, asOf, apply: true });
    const repeat = await reconcileGamification(db, { childProfileId: childId, asOf, apply: true });
    expect(repeat.profiles[0]).toMatchObject({
      missingAwards: [],
      profileCacheChanged: false,
      sessionCaches: [],
    });
    expect(
      await db.xpEvent.findMany({ where: { childProfileId: childId }, orderBy: { id: "asc" } }),
    ).toEqual(xpBefore);
    expect((await end(id).expect(200)).body.completionRewardXp).toBe(0);
  });
  it("preserves runtime awards, provider selection and unrelated profile data through two seeds and reconciliation", async () => {
    const oldEmail = process.env.DEMO_USER_EMAIL;
    const oldToken = token;
    const email = `phase7-demo-${randomUUID()}@talkytown.local`;
    const user = await db.user.create({ data: { email, displayAlias: "Demo Tutor" } });
    users.push(user.id);
    await db.aiProviderConfig.create({
      data: { userId: user.id, providerType: "mock", model: "talkytown-mock" },
    });
    token = app.get(JwtService).sign({ sub: user.id, role: "adult" });
    process.env.DEMO_USER_EMAIL = email;
    try {
      const childId = await child("Sofia");
      const id = await start(childId);
      await send(id, "I likes dogs").expect(200);
      const runtimeAwards = await db.childBadge.findMany({
        where: { childProfileId: childId },
        orderBy: { id: "asc" },
      });
      expect(runtimeAwards).toHaveLength(2);
      const unrelatedId = await child("Unrelated Pilot");
      await db.childProfile.update({
        where: { id: unrelatedId },
        data: { age: 10, level: "explorer", xpTotal: 71, streakDays: 8 },
      });
      const unrelated = await db.childProfile.findUniqueOrThrow({ where: { id: unrelatedId } });
      await db.aiProviderConfig.updateMany({
        where: { userId: user.id },
        data: { isActive: false },
      });
      const selected = await db.aiProviderConfig.create({
        data: {
          userId: user.id,
          providerType: "local-openai-compatible",
          model: "offline-test",
          baseUrl: "http://localhost:11434/v1",
          isActive: true,
        },
      });
      await db.$transaction((tx) => synchronizeBadgeCatalog(tx));
      await db.$transaction((tx) => synchronizeBadgeCatalog(tx));
      await seedDemo(db, asOf);
      const first = await verifyDemoData(db, asOf);
      await seedDemo(db, asOf);
      const second = await verifyDemoData(db, asOf);
      expect(second).toEqual(first);
      expect(second.awardProvenance).toEqual({ demo: 5, preservedNonDemo: 2 });
      expect(second.counts).toMatchObject({ badges: 7, childBadges: 7, xpEvents: 14 });
      const actual = await db.childBadge.findMany({
        where: { id: { in: runtimeAwards.map((award) => award.id) } },
        orderBy: { id: "asc" },
      });
      expect(actual).toEqual(runtimeAwards);
      expect(await db.childProfile.findUniqueOrThrow({ where: { id: unrelatedId } })).toEqual(
        unrelated,
      );
      expect(await db.aiProviderConfig.findUniqueOrThrow({ where: { id: selected.id } })).toEqual(
        selected,
      );
      expect(
        (
          await db.aiProviderConfig.findUniqueOrThrow({
            where: { userId_providerType: { userId: user.id, providerType: "mock" } },
          })
        ).isActive,
      ).toBe(false);
      const xpBefore = await db.xpEvent.findMany({
        where: { childProfileId: childId },
        orderBy: { id: "asc" },
      });
      expect(xpBefore.reduce((sum, event) => sum + event.amount, 0)).toBe(125);
      for (let i = 0; i < 2; i++)
        await reconcileGamification(db, { apply: true, childProfileId: childId, asOf });
      expect(
        await db.xpEvent.findMany({ where: { childProfileId: childId }, orderBy: { id: "asc" } }),
      ).toEqual(xpBefore);
      expect(await db.childBadge.count({ where: { childProfileId: childId } })).toBe(6); // ten practice events unlock Brave Speaker
      expect(
        await db.childBadge.findMany({
          where: { id: { in: runtimeAwards.map((award) => award.id) } },
          orderBy: { id: "asc" },
        }),
      ).toEqual(runtimeAwards);
      expect(await db.childProfile.findUniqueOrThrow({ where: { id: unrelatedId } })).toEqual(
        unrelated,
      );
      expect(await db.aiProviderConfig.findUniqueOrThrow({ where: { id: selected.id } })).toEqual(
        selected,
      );
    } finally {
      if (oldEmail === undefined) delete process.env.DEMO_USER_EMAIL;
      else process.env.DEMO_USER_EMAIL = oldEmail;
      token = oldToken;
    }
  });
});
