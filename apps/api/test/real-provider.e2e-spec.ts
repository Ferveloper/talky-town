import { randomUUID } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JwtService } from "@nestjs/jwt";
import { MockAiProvider, OpenAiCompatibleTransport } from "@talkytown/ai-core";
import { AiProvidersService } from "../src/ai-providers/ai-providers.service";
import { ProviderDnsResolver } from "../src/ai-providers/provider-url-policy.service";
import { fakeOpenAiServer } from "./helpers/fake-openai-server";
import { testApp } from "./helpers/test-app";
describe("complete configured provider HTTP path", () => {
  let fake: Awaited<ReturnType<typeof fakeOpenAiServer>>;
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let token: string;
  let childId: string;
  const api = () => fixture.app.getHttpServer();
  const local = "/ai-providers/local-openai-compatible";
  const auth = () => ({ Authorization: "Bearer " + token });
  const configure = (baseUrl = fake.baseUrl, model = "first-model") =>
    request(api())
      .put(local + "/config")
      .set(auth())
      .send({ baseUrl, model });
  const activate = (providerType = "local-openai-compatible") =>
    request(api()).put("/ai-providers/active").set(auth()).send({ providerType });
  const start = (guided = false) =>
    request(api())
      .post("/conversations/sessions")
      .set(auth())
      .send({
        requestId: randomUUID(),
        childProfileId: childId,
        mode: guided ? "guided-mission" : "free-talk",
        ...(guided ? { missionCode: "animal-adventure" } : {}),
      });
  const message = (id: string, text: string, requestId = randomUUID()) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .set(auth())
      .send({ requestId, message: text });
  beforeEach(async () => {
    fake = await fakeOpenAiServer();
    fixture = await testApp({ policy: fake.policy });
    token = (await request(api()).post("/auth/demo").expect(200)).body.accessToken;
    childId = (
      await request(api())
        .post("/child-profiles")
        .set(auth())
        .send({
          alias: "Real Explorer",
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
    await fake?.close();
  });
  it("tests inference/schema without content persistence, activates without inference and completes a real-adapter mission", async () => {
    await configure().expect(200);
    await activate().expect(200);
    expect(fake.requests).toHaveLength(0);
    const tested = await request(api())
      .post(local + "/test")
      .set(auth())
      .expect(200);
    expect(tested.body).toMatchObject({ available: true, model: "first-model" });
    expect(tested.body).not.toHaveProperty("reply");
    expect(fixture.rows("conversationTurn")).toHaveLength(0);
    const id = (await start(true).expect(201)).body.session.id;
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    expect(fake.requests).toHaveLength(1);
    expect((await message(id, "dog").expect(200)).body.session.missionProgress).toBe(33);
    expect(
      (await message(id, "I likes dogs").expect(200)).body.childTurn.correction.corrected,
    ).toBe("I like dogs");
    const operation = randomUUID();
    const completed = await message(id, "cat", operation).expect(200);
    expect(completed.body.session).toMatchObject({
      aiProviderType: "local-openai-compatible",
      aiModel: "first-model",
      missionProgress: 100,
      xpEarned: 45,
    });
    expect(completed.body.awardedBadges).toContain("animal-explorer");
    await message(id, "cat", operation).expect(200);
    expect(fake.requests).toHaveLength(4);
    expect(mock).not.toHaveBeenCalled();
    expect(fixture.rows("conversationTurn")).toHaveLength(7);
    expect(fixture.rows("xpEvent")).toHaveLength(4);
    const progress = await request(api())
      .get(`/child-profiles/${childId}/progress`)
      .set(auth())
      .expect(200);
    expect(progress.body).toMatchObject({ xpTotal: 45, learningLevel: "hero" });
  });
  it("pins provider/model through active/default-model changes; URL changes only block active sessions", async () => {
    await configure().expect(200);
    await activate().expect(200);
    const id = (await start().expect(201)).body.session.id;
    await configure(fake.baseUrl, "new-model").expect(200);
    await activate("mock").expect(200);
    await message(id, "dog").expect(200);
    expect(fake.requests[0]!.body.model).toBe("first-model");
    expect((await start().expect(201)).body.session.aiProviderType).toBe("mock");
    await configure(`http://127.0.0.1:${fake.port}/different/v1`)
      .expect(409)
      .expect({ code: "PROVIDER_CONFIG_IN_USE", activeSessionCount: 1 });
    await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
    await configure(`http://127.0.0.1:${fake.port}/different/v1`).expect(200);
    await activate().expect(200);
    const abandoned = (await start().expect(201)).body.session.id;
    await request(api()).post(`/conversations/sessions/${abandoned}/end`).set(auth()).expect(200);
    await configure().expect(200);
  });
  it("repairs one malformed response and leaves failed operations entirely unpersisted", async () => {
    await configure().expect(200);
    await activate().expect(200);
    const id = (await start().expect(201)).body.session.id;
    fake.state.invalidAttempts = 1;
    await message(id, "dog").expect(200);
    expect(fake.requests).toHaveLength(2);
    const before = [
      fixture.rows("conversationTurn").length,
      fixture.rows("xpEvent").length,
      fixture.rows("vocabularyItem").length,
    ];
    fake.state.invalid = true;
    const requestId = randomUUID();
    await message(id, "cat", requestId).expect(502).expect({ code: "PROVIDER_INVALID_RESPONSE" });
    expect([
      fixture.rows("conversationTurn").length,
      fixture.rows("xpEvent").length,
      fixture.rows("vocabularyItem").length,
    ]).toEqual(before);
    fake.state.invalid = false;
    await message(id, "cat", requestId).expect(200);
    expect(fixture.rows("xpEvent")).toHaveLength(2);
  });
  it("never reports a malformed provider as available", async () => {
    await configure().expect(200);
    fake.state.invalid = true;
    await request(api())
      .post(local + "/test")
      .set(auth())
      .expect(502)
      .expect({ code: "PROVIDER_INVALID_RESPONSE" });
    expect(fake.requests).toHaveLength(2);
    expect(fixture.rows("conversationTurn")).toHaveLength(0);
  });
  it("blocks unsafe input before inference and discards unsafe generated text", async () => {
    await configure().expect(200);
    await activate().expect(200);
    const id = (await start().expect(201)).body.session.id;
    await message(id, "my phone is 612 345 678").expect(200);
    expect(fake.requests).toHaveLength(0);
    fake.state.unsafe = true;
    const response = await message(id, "dog").expect(200);
    expect(response.body.childTurn).toBeNull();
    expect(fixture.rows("xpEvent")).toHaveLength(0);
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
    expect(JSON.stringify(turns)).not.toContain("phone");
    expect(JSON.stringify([turns, safety])).not.toContain("612");
  });
  it("enforces ownership, rejects credentials and documents new routes", async () => {
    await configure().expect(200);
    await request(api())
      .put(local + "/config")
      .set(auth())
      .send({ baseUrl: fake.baseUrl, model: "test", apiKey: "private-value" })
      .expect(400);
    await request(api())
      .post(local + "/test")
      .set(auth())
      .send({ apiKey: "private-value" })
      .expect(400);
    await request(api())
      .post(local + "/test")
      .expect(401);
    token = await fixture.app.get(JwtService).signAsync({ sub: "other-adult", role: "adult" });
    await request(api())
      .post(local + "/test")
      .set(auth())
      .expect(422)
      .expect({ code: "PROVIDER_NOT_CONFIGURED" });
    await activate().expect(422);
    expect(fixture.swagger.paths).toHaveProperty("/ai-providers/{providerType}/config");
    expect(fixture.swagger.paths).toHaveProperty("/ai-providers/{providerType}/test");
  });
  it("cloud activation checks key presence without claiming validity or calling upstream", async () => {
    await fixture.app.close();
    const complete = vi.fn().mockRejectedValue(new Error("should not run during activation"));
    fixture = await testApp({
      policy: fake.policy,
      transport: { complete },
      config: { AI_CLOUD_API_KEY: "present-not-verified" },
    });
    token = (await request(api()).post("/auth/demo")).body.accessToken;
    vi.spyOn(fixture.app.get(ProviderDnsResolver), "lookup").mockResolvedValue([
      { address: "8.8.8.8", family: 4 },
    ]);
    await request(api())
      .put("/ai-providers/openai-compatible-cloud/config")
      .set(auth())
      .send({ baseUrl: "https://trusted.test/v1", model: "test" })
      .expect(200);
    await activate("openai-compatible-cloud").expect(200);
    expect(complete).not.toHaveBeenCalled();
    await request(api()).post("/ai-providers/openai-compatible-cloud/test").set(auth()).expect(503);
    expect(complete).toHaveBeenCalledTimes(1);
    const catalog = await request(api()).get("/ai-providers").set(auth()).expect(200);
    expect(catalog.text).not.toContain("present-not-verified");
  });
  it("fails explicitly for absent session configuration and never substitutes Mock", async () => {
    await configure().expect(200);
    await activate().expect(200);
    const id = (await start().expect(201)).body.session.id;
    fixture.rows("aiProviderConfig").splice(
      fixture
        .rows("aiProviderConfig")
        .findIndex((row) => row.providerType === "local-openai-compatible"),
      1,
    );
    const spy = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    await message(id, "dog").expect(422).expect({ code: "PROVIDER_NOT_CONFIGURED" });
    expect(spy).not.toHaveBeenCalled();
    expect(fixture.rows("xpEvent")).toHaveLength(0);
    expect(fixture.app.get(AiProvidersService)).toBeDefined();
    expect(fixture.app.get(OpenAiCompatibleTransport)).toBeDefined();
  });
});
