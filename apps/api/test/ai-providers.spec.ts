import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { AiProvidersService } from "../src/ai-providers/ai-providers.service";
import { MockAiProvider } from "@talkytown/ai-core";
import { testApp } from "./helpers/test-app";
describe("database-authoritative provider API", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let token: string;
  beforeAll(async () => {
    fixture = await testApp();
    token = (await request(fixture.app.getHttpServer()).post("/auth/demo")).body.accessToken;
  });
  afterAll(async () => {
    await fixture?.app.close();
  });
  it("lists capabilities and activates configured Mock", async () => {
    const catalog = await request(fixture.app.getHttpServer())
      .get("/ai-providers")
      .auth(token, { type: "bearer" })
      .expect(200);
    expect(catalog.body.activeProvider).toBe("mock");
    expect(
      catalog.body.items.filter((item: { executable: boolean }) => item.executable),
    ).toHaveLength(3);
    await request(fixture.app.getHttpServer())
      .put("/ai-providers/active")
      .auth(token, { type: "bearer" })
      .send({ providerType: "mock" })
      .expect(200);
  });
  it.each(["openai-compatible-cloud", "local-openai-compatible"])(
    "rejects activation of %s without mutation",
    async (providerType) => {
      const before = structuredClone(fixture.rows("aiProviderConfig"));
      await request(fixture.app.getHttpServer())
        .put("/ai-providers/active")
        .auth(token, { type: "bearer" })
        .send({ providerType })
        .expect(422)
        .expect({ code: "PROVIDER_NOT_CONFIGURED" });
      expect(fixture.rows("aiProviderConfig")).toEqual(before);
    },
  );
  it("reports invalid selection without allowing environment to override it", async () => {
    const selected = fixture.rows("aiProviderConfig").find((row) => row.userId === "demo-adult")!;
    selected.providerType = "local-openai-compatible";
    process.env.AI_PROVIDER = "mock";
    try {
      await request(fixture.app.getHttpServer())
        .get("/ai-providers")
        .auth(token, { type: "bearer" })
        .expect(200);
      await expect(
        fixture.app.get(AiProvidersService).selected("demo-adult"),
      ).rejects.toMatchObject({ response: { code: "PROVIDER_NOT_CONFIGURED" } });
    } finally {
      delete process.env.AI_PROVIDER;
      selected.providerType = "mock";
    }
  });
  it("rejects missing, multiple, and invalid technical configuration", async () => {
    const selected = fixture.rows("aiProviderConfig").find((row) => row.userId === "demo-adult")!;
    selected.isActive = false;
    await request(fixture.app.getHttpServer())
      .get("/ai-providers")
      .auth(token, { type: "bearer" })
      .expect(200);
    await expect(fixture.app.get(AiProvidersService).selected("demo-adult")).rejects.toMatchObject({
      response: { code: "PROVIDER_CONFIGURATION_INVALID" },
    });
    selected.isActive = true;
    selected.model = "pretend-cloud-model";
    await request(fixture.app.getHttpServer())
      .get("/ai-providers")
      .auth(token, { type: "bearer" })
      .expect(200);
    await expect(fixture.app.get(AiProvidersService).selected("demo-adult")).rejects.toMatchObject({
      response: { code: "PROVIDER_CONFIGURATION_INVALID" },
    });
    selected.model = "talkytown-mock";
    fixture
      .rows("aiProviderConfig")
      .push({ ...selected, id: "second-config", providerType: "openai-compatible-cloud" });
    await request(fixture.app.getHttpServer())
      .get("/ai-providers")
      .auth(token, { type: "bearer" })
      .expect(200);
    await expect(fixture.app.get(AiProvidersService).selected("demo-adult")).rejects.toMatchObject({
      response: { code: "PROVIDER_CONFIGURATION_INVALID" },
    });
    fixture.rows("aiProviderConfig").pop();
  });
  it("handles Mock generation failure without selecting another adapter", async () => {
    const mock = fixture.app.get(MockAiProvider);
    vi.spyOn(mock, "generateConversationReply").mockRejectedValueOnce(
      new Error("private provider error"),
    );
    const service = fixture.app.get(AiProvidersService);
    const result = await service.generate("demo-adult", await service.selected("demo-adult"), {
      ageBand: "8-10",
      learningLevel: "starter",
      mode: "free-talk",
      message: "dog",
    });
    expect(result.reply).toContain("keep practicing");
    expect(JSON.stringify(result)).not.toContain("private");
    vi.restoreAllMocks();
  });
});
