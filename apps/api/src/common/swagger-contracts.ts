import type { OpenAPIObject } from "@nestjs/swagger";
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
const text: SchemaObject = { type: "string" };
const integer: SchemaObject = { type: "integer" };
const boolean: SchemaObject = { type: "boolean" };
const date: SchemaObject = { type: "string", format: "date-time" };
const ref = (name: string) => ({ $ref: "#/components/schemas/" + name });
const array = (items: SchemaObject | { $ref: string }): SchemaObject => ({ type: "array", items });
const object = (
  properties: NonNullable<SchemaObject["properties"]>,
  required = Object.keys(properties),
): SchemaObject => ({ type: "object", properties, required });
const items = (name: string) => object({ items: array(ref(name)) });
export function attachResponseContracts(document: OpenAPIObject) {
  const schemas: Record<string, SchemaObject> = {
    AdultIdentity: object({
      id: text,
      displayAlias: text,
      role: { type: "string", enum: ["adult"] },
    }),
    DemoLoginResponse: object({
      accessToken: text,
      tokenType: { type: "string", enum: ["Bearer"] },
      expiresIn: { type: "integer", example: 7200 },
      user: ref("AdultIdentity"),
    }),
    ApiChildProfile: object({
      id: text,
      alias: text,
      age: integer,
      ageBand: { type: "string", enum: ["5-7", "8-10", "11-12"] },
      nativeLanguage: text,
      targetLanguage: text,
      learningLevel: { type: "string", enum: ["starter", "explorer", "hero"] },
      avatarCode: { ...text, nullable: true },
      xpTotal: integer,
      streakDays: integer,
    }),
    ApiAvatar: object({ code: text, name: text, personality: text }),
    ApiMission: object({
      id: text,
      code: text,
      title: text,
      description: text,
      minAge: integer,
      maxAge: integer,
      estimatedXp: integer,
    }),
    ApiCorrection: object({ needed: boolean, corrected: text, explanation: text }, ["needed"]),
    ApiTurn: object({
      id: text,
      role: { type: "string", enum: ["child", "avatar", "system"] },
      content: text,
      inputMode: { type: "string", enum: ["text", "voice"] },
      correction: ref("ApiCorrection"),
      xpAwarded: integer,
      createdAt: date,
    }),
    ApiSession: object({
      id: text,
      childProfileId: text,
      avatarCode: { ...text, nullable: true },
      missionCode: { ...text, nullable: true },
      mode: { type: "string", enum: ["free-talk", "guided-mission"] },
      status: { type: "string", enum: ["active", "completed", "abandoned"] },
      missionProgress: { type: "integer", minimum: 0, maximum: 100 },
      xpEarned: integer,
      aiProviderType: { ...text, nullable: true },
      aiModel: { ...text, nullable: true },
      startedAt: date,
      endedAt: { ...date, nullable: true },
    }),
    ApiSafety: object({ flagged: boolean, reason: text }, ["flagged"]),
    ApiMessage: object({
      childTurn: { allOf: [ref("ApiTurn")], nullable: true },
      avatarTurn: ref("ApiTurn"),
      xpAwarded: integer,
      practicedVocabulary: array(text),
      awardedBadges: array(text),
      safety: ref("ApiSafety"),
      session: ref("ApiSession"),
    }),
    ApiVocabulary: object({
      id: text,
      childProfileId: text,
      language: text,
      term: text,
      normalizedTerm: text,
      practiceCount: integer,
      successfulUseCount: integer,
      firstSeenAt: date,
      lastPracticedAt: date,
    }),
    ApiProgress: object({
      childProfileId: text,
      learningLevel: { type: "string", enum: ["starter", "explorer", "hero"] },
      streakDays: integer,
      xpTotal: integer,
      completedSessions: integer,
      completedMissionCount: integer,
      completedMissionCodes: array(text),
      badges: array(object({ code: text, title: text, awardedAt: date })),
      vocabulary: array(ref("ApiVocabulary")),
      lastPracticedAt: { ...date, nullable: true },
      recentSessions: array(ref("ApiSession")),
    }),
    ApiProviders: object({
      activeProvider: {
        type: "string",
        enum: ["mock", "openai-compatible-cloud", "local-openai-compatible"],
      },
      items: array(
        object({ providerType: text, executable: boolean, activatable: boolean, active: boolean }),
      ),
    }),
    ApiError: object({ code: text, fields: array(object({ field: text, rules: array(text) })) }, [
      "code",
    ]),
  };
  document.components ??= {};
  document.components.schemas = { ...document.components.schemas, ...schemas };
  const routes: [string, "get" | "post" | "put", SchemaObject | { $ref: string }, string][] = [
    ["/auth/demo", "post", ref("DemoLoginResponse"), "200"],
    ["/auth/me", "get", ref("AdultIdentity"), "200"],
    ["/child-profiles", "get", items("ApiChildProfile"), "200"],
    ["/child-profiles", "post", ref("ApiChildProfile"), "201"],
    ["/child-profiles/{id}", "get", ref("ApiChildProfile"), "200"],
    ["/child-profiles/{id}/missions", "get", items("ApiMission"), "200"],
    ["/avatars", "get", items("ApiAvatar"), "200"],
    [
      "/conversations/sessions",
      "post",
      object({ session: ref("ApiSession"), openingTurn: ref("ApiTurn") }),
      "201",
    ],
    ["/conversations/sessions/{id}", "get", ref("ApiSession"), "200"],
    [
      "/conversations/sessions/{id}/turns",
      "get",
      object({ items: array(ref("ApiTurn")), nextCursor: { ...text, nullable: true } }),
      "200",
    ],
    ["/conversations/sessions/{id}/messages", "post", ref("ApiMessage"), "200"],
    ["/conversations/sessions/{id}/end", "post", ref("ApiSession"), "200"],
    ["/child-profiles/{id}/progress", "get", ref("ApiProgress"), "200"],
    ["/ai-providers", "get", ref("ApiProviders"), "200"],
    ["/ai-providers/active", "put", ref("ApiProviders"), "200"],
  ];
  for (const [path, method, schema, status] of routes) {
    const operation = document.paths[path]?.[method];
    if (!operation) continue;
    operation.responses[status] = {
      description: "Successful operation",
      content: { "application/json": { schema } },
    };
    if (path === "/conversations/sessions" && method === "post")
      operation.responses["200"] = {
        description: "Idempotent session replay",
        content: { "application/json": { schema } },
      };
    for (const code of ["400", "401", "404", "409", "422", "503"])
      operation.responses[code] = {
        description: "Controlled error; no raw input",
        content: { "application/json": { schema: ref("ApiError") } },
      };
  }
}
