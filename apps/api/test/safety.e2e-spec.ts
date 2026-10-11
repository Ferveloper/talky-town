import { randomUUID } from "node:crypto";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  MockAiProvider,
  type AiConversationResponse,
  type ChatCompletionBody,
} from "@talkytown/ai-core";
import { ProviderDnsResolver } from "../src/ai-providers/provider-url-policy.service";
import { ConversationStoreService } from "../src/conversations/conversation-store.service";
import { PersistenceIds } from "../src/common/persistence-ids.service";
import { safetyResponse } from "../src/safety/safety-responses";
import { allowedFixtures, blockedFixtures } from "./helpers/safety-fixtures";
import { fakeOpenAiServer } from "./helpers/fake-openai-server";
import { testApp } from "./helpers/test-app";

const safeOutput: AiConversationResponse = {
  reply: "Great practice!",
  correction: { needed: false },
  newVocabulary: [],
  avatarEmotion: "encouraging",
  safety: { flagged: false },
};
const unsafeOutputs: { id: string; output: AiConversationResponse }[] = [
  { id: "reply", output: { ...safeOutput, reply: "What is your name?" } },
  {
    id: "corrected",
    output: {
      ...safeOutput,
      correction: { needed: true, original: "dog", corrected: "My address is 12 Blue Street" },
    },
  },
  {
    id: "explanation",
    output: {
      ...safeOutput,
      correction: { needed: true, corrected: "dog", explanation: "Send me a photo" },
    },
  },
  { id: "vocabulary", output: { ...safeOutput, newVocabulary: ["child@example.test"] } },
  {
    id: "split-vocabulary",
    output: { ...safeOutput, newVocabulary: ["child", "@", "example.test"] },
  },
  { id: "provider-self-harm", output: { ...safeOutput, reply: "I want to die" } },
  { id: "provider-safety", output: { ...safeOutput, safety: { flagged: true, reason: "other" } } },
];

describe("Phase 6 contextual HTTP safety boundaries", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let token: string;
  let childId: string;
  let fake: Awaited<ReturnType<typeof fakeOpenAiServer>> | undefined;
  const api = () => fixture.app.getHttpServer();
  const auth = () => ({ Authorization: "Bearer " + token });
  const profileBody = {
    alias: "Safety Explorer",
    age: 9,
    nativeLanguage: "es",
    targetLanguage: "en",
    learningLevel: "explorer",
    avatarCode: "luna",
  };
  const start = (guided = false, requestId = randomUUID()) =>
    request(api())
      .post("/conversations/sessions")
      .set(auth())
      .send({
        requestId,
        childProfileId: childId,
        mode: guided ? "guided-mission" : "free-talk",
        ...(guided ? { missionCode: "animal-adventure" } : {}),
      });
  const send = (id: string, message: string, requestId = randomUUID(), extra = {}) =>
    request(api())
      .post(`/conversations/sessions/${id}/messages`)
      .set(auth())
      .send({ requestId, message, ...extra });
  async function createProfile() {
    token = (await request(api()).post("/auth/demo").expect(200)).body.accessToken;
    childId = (
      await request(api()).post("/child-profiles").set(auth()).send(profileBody).expect(201)
    ).body.id;
  }
  beforeEach(async () => {
    fixture = await testApp();
    await createProfile();
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await fixture?.app.close();
    await fake?.close();
    fake = undefined;
  });
  function learningState() {
    return structuredClone([
      fixture.rows("xpEvent"),
      fixture.rows("vocabularyItem"),
      fixture.rows("childBadge"),
      fixture.rows("childProfile"),
      fixture.rows("conversationSession"),
    ]);
  }
  it.each(allowedFixtures)(
    "accepts educational $id without false safety events",
    async ({ text }) => {
      const id = (await start().expect(201)).body.session.id;
      const result = await send(id, text, randomUUID(), { inputMode: "voice" }).expect(200);
      expect(result.body.safety).toEqual({ flagged: false });
      expect(result.body.childTurn.content).toBe(text);
      expect(result.body.childTurn.inputMode).toBe("voice");
      expect(fixture.rows("safetyEvent")).toHaveLength(0);
    },
  );
  it.each(blockedFixtures)(
    "blocks $id before inference and persistence",
    async ({ text, reason }) => {
      const id = (await start(true).expect(201)).body.session.id;
      const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
      const persistence = vi.spyOn(fixture.app.get(ConversationStoreService), "persist");
      const before = learningState();
      const operation = randomUUID();
      const result = await send(id, text, operation).expect(200);
      const replay = await send(id, text, operation).expect(200);
      expect(replay.body).toEqual(result.body);
      expect(result.body).toMatchObject({
        childTurn: null,
        xpAwarded: 0,
        practicedVocabulary: [],
        awardedBadges: [],
        safety: { flagged: true, reason },
      });
      expect(mock).not.toHaveBeenCalled();
      expect(persistence.mock.calls[0]![3]).toMatchObject({ kind: "blocked-input" });
      expect(Object.keys(persistence.mock.calls[0]![3]).sort()).toEqual([
        "decision",
        "kind",
        "snapshot",
      ]);
      expect(JSON.stringify(persistence.mock.calls[0]![3])).not.toContain(text);
      expect(learningState()).toEqual(before);
      expect(fixture.rows("safetyEvent")).toHaveLength(1);
    },
  );
  it("allows only trusted avatar identity and rejects requests for child identity", async () => {
    const id = (await start().expect(201)).body.session.id;
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    mock.mockResolvedValueOnce({ ...safeOutput, reply: "My name is Luna." });
    const accepted = await send(id, "What is your name?").expect(200);
    expect(accepted.body.safety.flagged).toBe(false);
    mock.mockResolvedValueOnce({ ...safeOutput, reply: "What is your name?" });
    expect((await send(id, "hello").expect(200)).body.safety.flagged).toBe(true);
  });
  it("allows fictional sight vocabulary but discards a claim to observe the child", async () => {
    const id = (await start().expect(201)).body.session.id;
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    mock.mockResolvedValueOnce({ ...safeOutput, reply: "I can see a star in our pretend story." });
    expect((await send(id, "star").expect(200)).body.safety.flagged).toBe(false);
    mock.mockResolvedValueOnce({ ...safeOutput, reply: "I can see you in your room." });
    expect((await send(id, "hello").expect(200)).body.safety.flagged).toBe(true);
  });
  it.each(["content", "correctedContent", "correctionExplanation"] as const)(
    "guards historical %s even when correctionNeeded=false",
    async (field) => {
      const id = (await start().expect(201)).body.session.id;
      const requestId = randomUUID();
      const result = await send(id, "dog", requestId).expect(200);
      const stored = fixture
        .rows("conversationTurn")
        .find((turn) => turn.id === result.body.childTurn.id)!;
      stored[field] = "child@example.test";
      stored.correctionNeeded = false;
      const before = learningState();
      await request(api()).get(`/conversations/sessions/${id}/turns`).set(auth()).expect(409);
      await send(id, "dog", requestId).expect(409);
      expect(learningState()).toEqual(before);
      await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
    },
  );
  it("rejects real mismatched correction originals before semantic moderation or persistence", async () => {
    fake = await fakeOpenAiServer();
    await fixture.app.close();
    fixture = await testApp({ policy: fake.policy });
    await createProfile();
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
    const id = (await start().expect(201)).body.session.id;
    const before = learningState();
    const persistence = vi.spyOn(fixture.app.get(ConversationStoreService), "persist");
    fake.state.response = {
      ...safeOutput,
      correction: { needed: true, original: "child@example.test", corrected: "dog" },
    };
    await send(id, "dog").expect(502).expect({ code: "PROVIDER_INVALID_RESPONSE" });
    expect(persistence).not.toHaveBeenCalled();
    expect(fake.requests).toHaveLength(2);
    expect(learningState()).toEqual(before);
  });
  it("does not expose unknown legacy safety reasons", async () => {
    const id = (await start().expect(201)).body.session.id;
    const requestId = randomUUID();
    await send(id, "I want to die", requestId).expect(200);
    fixture.rows("safetyEvent")[0]!.reason = "child@example.test";
    const result = await send(id, "I want to die", requestId).expect(200);
    expect(result.body.safety.reason).toBe("legacy-safety-event");
    expect(result.text).not.toContain("child@example.test");
  });
  it("screens aliases without rejecting arbitrary names and creates no unsafe profile/audit", async () => {
    const before = fixture.rows("childProfile").length;
    await request(api())
      .post("/child-profiles")
      .set(auth())
      .send({ ...profileBody, alias: "Explorer 612345678" })
      .expect(400)
      .expect({ code: "UNSAFE_ALIAS" });
    expect(fixture.rows("childProfile")).toHaveLength(before);
    expect(fixture.rows("safetyEvent")).toHaveLength(0);
    await request(api())
      .post("/child-profiles")
      .set(auth())
      .send({ ...profileBody, alias: "Ana García" })
      .expect(201);
  });
  it("responds to child distress without requiring a usable provider", async () => {
    const id = (await start().expect(201)).body.session.id;
    fixture.rows("aiProviderConfig").length = 0;
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    const result = await send(id, "I want to die").expect(200);
    expect(result.body.avatarTurn.content).toBe(safetyResponse("self-harm", "8-10"));
    expect(fixture.rows("safetyEvent")[0]).toMatchObject({
      category: "wellbeing",
      severity: "critical",
      action: "support",
    });
    await send(id, "dog").expect(422);
    expect(mock).not.toHaveBeenCalled();
  });
  it("never echoes unknown validation keys or raw unsafe content through application logs", async () => {
    const id = (await start().expect(201)).body.session.id;
    const logs = [
      vi.spyOn(console, "log"),
      vi.spyOn(console, "warn"),
      vi.spyOn(console, "error"),
      vi.spyOn(Logger.prototype, "error"),
    ];
    const raw = "child@example.test";
    const response = await send(id, "dog", randomUUID(), { [raw]: "PRIVATE_VALUE" }).expect(400);
    expect(response.body.fields).toContainEqual({
      field: "unknown",
      rules: ["whitelistValidation"],
    });
    expect(response.text).not.toContain(raw);
    await send(id, raw).expect(200);
    expect(JSON.stringify(logs.flatMap((spy) => spy.mock.calls))).not.toContain(raw);
    expect(JSON.stringify(fixture.rows("safetyEvent"))).not.toContain(raw);
  });
  it("guards legacy alias responses while known-ID operations and other adults remain usable", async () => {
    fixture.rows("childProfile")[0]!.alias = "Explorer 612345678";
    const before = learningState();
    await request(api())
      .get("/child-profiles")
      .set(auth())
      .expect(409)
      .expect({ code: "SAFETY_REVIEW_REQUIRED" });
    await request(api()).get(`/child-profiles/${childId}`).set(auth()).expect(409);
    expect(learningState()).toEqual(before);
    const id = (await start().expect(201)).body.session.id;
    await send(id, "dog").expect(200);
    await request(api()).get(`/conversations/sessions/${id}`).set(auth()).expect(200);
    await request(api()).get(`/child-profiles/${childId}/progress`).set(auth()).expect(200);
    await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
    token = await fixture.app.get(JwtService).signAsync({ sub: "other-adult", role: "adult" });
    await request(api()).get("/child-profiles").set(auth()).expect(200).expect({ items: [] });
    await request(api()).get(`/child-profiles/${childId}`).set(auth()).expect(404);
    await send(id, "dog").expect(404);
  });
  it("guards historical replay only at response boundaries, preserving mission evidence", async () => {
    const openingRequest = randomUUID();
    const opened = await start(true, openingRequest).expect(201);
    const id = opened.body.session.id;
    const firstRequest = randomUUID();
    const first = await send(id, "dog", firstRequest).expect(200);
    const stored = fixture
      .rows("conversationTurn")
      .find((turn) => turn.id === first.body.childTurn.id)!;
    stored.content = "dog You are my only friend";
    const before = learningState();
    await send(id, "dog", firstRequest).expect(409).expect({ code: "SAFETY_REVIEW_REQUIRED" });
    await request(api()).get(`/conversations/sessions/${id}/turns`).set(auth()).expect(409);
    expect(learningState()).toEqual(before);
    const mock = vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply");
    expect((await send(id, "I like cats").expect(200)).body.session.missionProgress).toBe(67);
    expect((await send(id, "dog").expect(200)).body.session.missionProgress).toBe(67);
    expect(mock.mock.calls[1]![0].missionPrompt).toBe("Name a different animal.");
    const finalRequest = randomUUID();
    const final = await send(id, "cat", finalRequest).expect(200);
    expect(final.body.session).toMatchObject({
      status: "completed",
      missionProgress: 100,
      xpEarned: 50,
    });
    expect(final.body.awardedBadges).toContain("animal-explorer");
    await send(id, "cat", finalRequest).expect(200);
    expect(JSON.stringify(mock.mock.calls)).not.toContain(stored.content);
    expect(
      fixture.rows("xpEvent").filter((row) => row.reason === "mission-completed"),
    ).toHaveLength(1);
    fixture
      .rows("conversationTurn")
      .find((turn) => turn.id === opened.body.openingTurn.id)!.content =
      "What is your phone number?";
    await start(true, openingRequest).expect(409).expect({ code: "SAFETY_REVIEW_REQUIRED" });
    await request(api()).get(`/conversations/sessions/${id}`).set(auth()).expect(200);
    await request(api()).post(`/conversations/sessions/${id}/end`).set(auth()).expect(200);
  });
  it("does not roll back a committed operation when response review refuses disclosure", async () => {
    const id = (await start().expect(201)).body.session.id;
    const service = fixture.app.get(ConversationStoreService);
    const original = service.persist.bind(service);
    vi.spyOn(service, "persist").mockImplementation(async (...args) => {
      const result = await original(...args);
      fixture.rows("conversationTurn").find((turn) => turn.id === result.avatarTurn.id)!.content =
        "What is your phone number?";
      return (await service.replay(args[0], args[1], args[2]))!;
    });
    const requestId = randomUUID();
    await send(id, "dog", requestId).expect(409);
    await send(id, "dog", requestId).expect(409);
    expect(fixture.rows("xpEvent")).toHaveLength(1);
    expect(fixture.rows("conversationTurn")).toHaveLength(3);
    const ids = fixture.app.get(PersistenceIds);
    expect(fixture.rows("xpEvent")[0]!.id).toBe(ids.practiceXp(ids.operation(id, requestId)));
  });

  for (const providerType of [
    "mock",
    "openai-compatible-cloud",
    "local-openai-compatible",
  ] as const) {
    it.each(unsafeOutputs)(
      `${providerType} discards generated $id without child-support inference`,
      async ({ output }) => {
        const calls: ChatCompletionBody[] = [];
        if (providerType === "mock") {
          vi.spyOn(fixture.app.get(MockAiProvider), "generateConversationReply").mockResolvedValue(
            output,
          );
        } else {
          fake = await fakeOpenAiServer();
          await fixture.app.close();
          const transport =
            providerType === "openai-compatible-cloud"
              ? {
                  complete: vi.fn(async (_config, body: ChatCompletionBody) => {
                    calls.push(body);
                    return {
                      choices: [
                        {
                          index: 0,
                          finish_reason: "stop",
                          message: { role: "assistant", content: JSON.stringify(output) },
                        },
                      ],
                    };
                  }),
                }
              : undefined;
          fixture = await testApp({
            policy: fake.policy,
            transport,
            config: { AI_CLOUD_API_KEY: "deterministic-test-key" },
          });
          await createProfile();
          if (providerType === "openai-compatible-cloud")
            vi.spyOn(fixture.app.get(ProviderDnsResolver), "lookup").mockResolvedValue([
              { address: "8.8.8.8", family: 4 },
            ]);
          if (providerType === "local-openai-compatible") {
            fake.state.response = output;
          }
          await request(api())
            .put(`/ai-providers/${providerType}/config`)
            .set(auth())
            .send({
              baseUrl:
                providerType === "openai-compatible-cloud"
                  ? "https://trusted.test/v1"
                  : fake.baseUrl,
              model: "safety-test-model",
            })
            .expect(200);
          await request(api())
            .put("/ai-providers/active")
            .set(auth())
            .send({ providerType })
            .expect(200);
        }
        const id = (await start(true).expect(201)).body.session.id;
        const persistence = vi.spyOn(fixture.app.get(ConversationStoreService), "persist");
        const before = learningState();
        const requestId = randomUUID();
        const result = await send(id, "dog", requestId).expect(200);
        await send(id, "dog", requestId).expect(200);
        expect(result.body).toMatchObject({
          childTurn: null,
          xpAwarded: 0,
          safety: { flagged: true, reason: "unsafe-provider-output" },
        });
        expect(result.body.avatarTurn.content).toBe(safetyResponse("redirect", "8-10"));
        expect(learningState()).toEqual(before);
        const prepared = persistence.mock.calls[0]![3];
        expect(Object.keys(prepared).sort()).toEqual(["decision", "kind", "provider", "snapshot"]);
        expect(prepared.kind).toBe("blocked-output");
        expect(fixture.rows("safetyEvent")[0]!.action).toBe("redirect");
        if (providerType === "openai-compatible-cloud") expect(calls).toHaveLength(1);
        if (providerType === "local-openai-compatible") expect(fake!.requests).toHaveLength(1);
      },
    );
  }
});
