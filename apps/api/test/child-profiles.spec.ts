import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testApp } from "./helpers/test-app";
import { JwtService } from "@nestjs/jwt";
describe("profile HTTP contracts and ownership", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let app: INestApplication;
  let token: string;
  const body = {
    alias: "Star Explorer",
    age: 9,
    nativeLanguage: "es",
    targetLanguage: "en",
    learningLevel: "hero",
    avatarCode: "luna",
  };
  beforeAll(async () => {
    fixture = await testApp();
    app = fixture.app;
    token = (await request(app.getHttpServer()).post("/auth/demo").expect(200)).body.accessToken;
  });
  afterAll(async () => {
    await app?.close();
  });
  it("creates multiword alias and maps proficiency without exposing Prisma level", async () => {
    const response = await request(app.getHttpServer())
      .post("/child-profiles")
      .auth(token, { type: "bearer" })
      .send({ ...body, alias: "  Star Explorer  " })
      .expect(201);
    expect(response.body).toMatchObject({
      alias: body.alias,
      learningLevel: "hero",
      ageBand: "8-10",
      xpTotal: 0,
      streakDays: 0,
    });
    expect(response.body).not.toHaveProperty("level");
    expect(fixture.rows("childProfile")[0]?.level).toBe("hero");
    const outsider = await app.get(JwtService).signAsync({ sub: "other-adult", role: "adult" });
    await request(app.getHttpServer())
      .get("/child-profiles/" + response.body.id)
      .auth(outsider, { type: "bearer" })
      .expect(404);
    await request(app.getHttpServer())
      .get("/child-profiles/" + response.body.id + "/missions")
      .auth(outsider, { type: "bearer" })
      .expect(404);
    await request(app.getHttpServer())
      .get("/child-profiles/" + response.body.id + "/progress")
      .auth(outsider, { type: "bearer" })
      .expect(404);
    await request(app.getHttpServer())
      .post("/child-profiles")
      .auth(token, { type: "bearer" })
      .send(body)
      .expect(409);
  });
  it.each([
    { avatarCode: undefined },
    { learningLevel: "level-2" },
    { age: 4 },
    { age: 13 },
    { age: "9" },
    { level: "starter" },
    { userId: "other-adult" },
    { alias: "test@example.test" },
  ])("rejects invalid or overposted fields %j", async (change) => {
    const response = await request(app.getHttpServer())
      .post("/child-profiles")
      .auth(token, { type: "bearer" })
      .send({ ...body, ...change })
      .expect(400);
    expect(response.body.code).toBe("VALIDATION_ERROR");
    expect(response.text).not.toContain("@example");
    expect(response.body).not.toHaveProperty("message");
  });
  it.each([
    [5, "5-7"],
    [7, "5-7"],
    [8, "8-10"],
    [10, "8-10"],
    [11, "11-12"],
    [12, "11-12"],
  ])("derives band at age %s", async (age, band) => {
    const result = await request(app.getHttpServer())
      .post("/child-profiles")
      .auth(token, { type: "bearer" })
      .send({ ...body, alias: "Explorer " + age, age })
      .expect(201);
    expect(result.body.ageBand).toBe(band);
    const missions = await request(app.getHttpServer())
      .get("/child-profiles/" + result.body.id + "/missions")
      .auth(token, { type: "bearer" })
      .expect(200);
    for (const mission of missions.body.items) {
      expect(mission.minAge).toBeLessThanOrEqual(age);
      expect(mission.maxAge).toBeGreaterThanOrEqual(age);
    }
  });
  it("requires auth and rejects inactive avatar", async () => {
    await request(app.getHttpServer()).get("/child-profiles").expect(401);
    fixture.rows("avatar")[0]!.isActive = false;
    await request(app.getHttpServer())
      .post("/child-profiles")
      .auth(token, { type: "bearer" })
      .send({ ...body, alias: "New Alias" })
      .expect(422);
  });
});
