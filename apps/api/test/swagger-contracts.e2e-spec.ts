import type { OpenAPIObject } from "@nestjs/swagger";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testApp } from "./helpers/test-app";

type Schema = {
  $ref?: string;
  type?: string;
  format?: string;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, Schema>;
  items?: Schema;
};

describe("final Phase 7 OpenAPI document", () => {
  let fixture: Awaited<ReturnType<typeof testApp>>;
  let document: OpenAPIObject;
  const component = (name: string) => document.components?.schemas?.[name] as Schema;
  const response = (path: string, method: "get" | "post" | "put", status: string) => {
    const operation = document.paths[path]?.[method];
    expect(operation, `${method.toUpperCase()} ${path}`).toBeDefined();
    const result = operation?.responses[status];
    expect(result, `${method.toUpperCase()} ${path} ${status}`).toBeDefined();
    if (!result || !("content" in result) || !result.content?.["application/json"]?.schema)
      throw new Error(`Missing JSON response schema: ${method.toUpperCase()} ${path} ${status}`);
    return result.content["application/json"].schema as Schema;
  };
  const fields = (schema: Schema, names: string[]) => {
    expect(schema.type).toBe("object");
    expect(Object.keys(schema.properties ?? {}).sort()).toEqual([...names].sort());
    expect([...(schema.required ?? [])].sort()).toEqual([...names].sort());
  };

  beforeAll(async () => {
    fixture = await testApp();
    const result = await request(fixture.app.getHttpServer()).get("/docs-json").expect(200);
    document = result.body as OpenAPIObject;
  });
  afterAll(async () => fixture?.app.close());

  it("publishes Phase 7 metadata and preserves existing routes and response statuses", () => {
    expect(document.openapi).toMatch(/^3\./);
    expect(document.info).toMatchObject({ version: "0.7.0" });
    expect(document.info.description).toContain("Phase 7");
    for (const [path, method, statuses] of [
      ["/auth/demo", "post", ["200"]],
      ["/auth/me", "get", ["200"]],
      ["/child-profiles", "get", ["200"]],
      ["/child-profiles", "post", ["201"]],
      ["/child-profiles/{id}", "get", ["200"]],
      ["/child-profiles/{id}/missions", "get", ["200"]],
      ["/child-profiles/{id}/progress", "get", ["200"]],
      ["/avatars", "get", ["200"]],
      ["/conversations/sessions", "post", ["200", "201"]],
      ["/conversations/sessions/{id}", "get", ["200"]],
      ["/conversations/sessions/{id}/turns", "get", ["200"]],
      ["/conversations/sessions/{id}/messages", "post", ["200"]],
      ["/conversations/sessions/{id}/end", "post", ["200"]],
      ["/ai-providers", "get", ["200"]],
      ["/ai-providers/active", "put", ["200"]],
      ["/ai-providers/{providerType}/config", "put", ["200"]],
      ["/ai-providers/{providerType}/test", "post", ["200"]],
    ] as const) {
      for (const status of statuses) expect(response(path, method, status)).toBeDefined();
    }
    expect(response("/conversations/sessions/{id}/messages", "post", "200")).toEqual({
      $ref: "#/components/schemas/ApiMessage",
    });
    fields(component("ApiMessage"), [
      "childTurn",
      "avatarTurn",
      "xpAwarded",
      "practicedVocabulary",
      "awardedBadges",
      "safety",
      "session",
    ]);
  });

  it("documents complete profile responses with a required numeric gamification level", () => {
    const profile = component("ApiChildProfile");
    fields(profile, [
      "id",
      "alias",
      "age",
      "ageBand",
      "nativeLanguage",
      "targetLanguage",
      "learningLevel",
      "avatarCode",
      "xpTotal",
      "gamificationLevel",
      "streakDays",
    ]);
    expect(profile.properties?.gamificationLevel).toMatchObject({ type: "integer", minimum: 1 });
    expect(profile.properties?.avatarCode).toMatchObject({ type: "string", nullable: true });
    expect(profile.properties?.learningLevel?.enum).toEqual(["starter", "explorer", "hero"]);
    expect(profile.properties?.ageBand?.enum).toEqual(["5-7", "8-10", "11-12"]);
    expect(profile.properties?.xpTotal).toMatchObject({ type: "integer", minimum: 0 });
    expect(profile.properties?.streakDays).toMatchObject({ type: "integer", minimum: 0 });
    for (const [path, method, status] of [
      ["/child-profiles", "post", "201"],
      ["/child-profiles/{id}", "get", "200"],
    ] as const)
      expect(response(path, method, status)).toEqual({
        $ref: "#/components/schemas/ApiChildProfile",
      });
    expect(response("/child-profiles", "get", "200")).toMatchObject({
      properties: {
        items: { type: "array", items: { $ref: "#/components/schemas/ApiChildProfile" } },
      },
      required: ["items"],
    });
  });

  it("documents every progress field, level constraint and nullable badge timestamp", () => {
    const progress = component("ApiProgress");
    fields(progress, [
      "childProfileId",
      "learningLevel",
      "streakDays",
      "xpTotal",
      "gamificationLevel",
      "levelProgress",
      "practiceTimezone",
      "badgeCatalog",
      "completedSessions",
      "completedMissionCount",
      "completedMissionCodes",
      "badges",
      "vocabulary",
      "lastPracticedAt",
      "recentSessions",
    ]);
    expect(response("/child-profiles/{id}/progress", "get", "200")).toEqual({
      $ref: "#/components/schemas/ApiProgress",
    });
    expect(progress.properties?.gamificationLevel).toMatchObject({ type: "integer", minimum: 1 });
    expect(progress.properties?.practiceTimezone).toMatchObject({
      type: "string",
      enum: ["Europe/Madrid"],
    });
    expect(progress.properties?.levelProgress).toEqual({
      $ref: "#/components/schemas/ApiLevelProgress",
    });
    const level = component("ApiLevelProgress");
    fields(level, ["xpIntoLevel", "xpToNextLevel", "xpPerLevel"]);
    expect(level.properties?.xpIntoLevel).toMatchObject({
      type: "integer",
      minimum: 0,
      maximum: 49,
    });
    expect(level.properties?.xpToNextLevel).toMatchObject({
      type: "integer",
      minimum: 1,
      maximum: 50,
    });
    expect(level.properties?.xpPerLevel).toMatchObject({ type: "integer", enum: [50] });
    expect(progress.properties?.badgeCatalog).toMatchObject({
      type: "array",
      items: { $ref: "#/components/schemas/ApiBadgeCatalogItem" },
    });
    const badge = component("ApiBadgeCatalogItem");
    fields(badge, ["code", "title", "description", "icon", "unlocked", "awardedAt"]);
    expect(badge.properties?.unlocked?.type).toBe("boolean");
    expect(badge.properties?.awardedAt).toMatchObject({
      type: "string",
      format: "date-time",
      nullable: true,
    });
    expect(progress.properties?.lastPracticedAt).toMatchObject({
      format: "date-time",
      nullable: true,
    });
    expect(progress.properties?.badges?.items?.properties?.awardedAt?.format).toBe("date-time");
    expect(progress.properties?.vocabulary?.items).toEqual({
      $ref: "#/components/schemas/ApiVocabulary",
    });
    expect(progress.properties?.recentSessions?.items).toEqual({
      $ref: "#/components/schemas/ApiSession",
    });
  });

  it("documents the complete end response and stored reward on HTTP 200 only", () => {
    const session = component("ApiSession");
    fields(session, [
      "id",
      "childProfileId",
      "avatarCode",
      "missionCode",
      "mode",
      "status",
      "missionProgress",
      "xpEarned",
      "aiProviderType",
      "aiModel",
      "startedAt",
      "endedAt",
    ]);
    const end = component("ApiEndSession");
    fields(end, [...(session.required ?? []), "completionRewardXp"]);
    expect(end.properties).toMatchObject(session.properties!);
    expect(end.properties?.completionRewardXp).toMatchObject({ type: "integer", minimum: 0 });
    expect(end.properties?.endedAt).toMatchObject({ format: "date-time", nullable: true });
    expect(end.properties?.aiProviderType).toMatchObject({
      nullable: true,
      enum: ["mock", "openai-compatible-cloud", "local-openai-compatible"],
    });
    expect(end.properties?.mode?.enum).toEqual(["free-talk", "guided-mission"]);
    expect(end.properties?.status?.enum).toEqual(["active", "completed", "abandoned"]);
    expect(end.properties?.missionProgress).toMatchObject({ minimum: 0, maximum: 100 });
    expect(response("/conversations/sessions/{id}/end", "post", "200")).toEqual({
      $ref: "#/components/schemas/ApiEndSession",
    });
    expect(
      document.paths["/conversations/sessions/{id}/end"]?.post?.responses["201"],
    ).toBeUndefined();
    expect(response("/conversations/sessions/{id}", "get", "200")).toEqual({
      $ref: "#/components/schemas/ApiSession",
    });
  });

  it("has well formed required lists and resolvable references throughout the final document", () => {
    const schemas = document.components?.schemas ?? {};
    const inspect = (value: unknown): void => {
      if (Array.isArray(value)) {
        for (const item of value) inspect(item);
        return;
      }
      if (!value || typeof value !== "object") return;
      const node = value as Record<string, unknown>;
      if ("$ref" in node) {
        expect(node.$ref).toMatch(/^#\/components\/schemas\/[A-Za-z][A-Za-z0-9]*$/);
        expect(schemas[(node.$ref as string).split("/").at(-1)!]).toBeDefined();
      }
      if (Array.isArray(node.required)) {
        for (const name of node.required as string[]) expect(node.properties).toHaveProperty(name);
      }
      if (node.type === "array") expect(node.items).toBeDefined();
      for (const nested of Object.values(node)) inspect(nested);
    };
    inspect(document.components);
    inspect(document.paths);
  });
});
