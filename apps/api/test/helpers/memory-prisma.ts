import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import type { PrismaService } from "../../src/prisma/prisma.service";
type Row = Record<string, unknown>;
type Query = {
  where?: Row;
  data?: Row;
  create?: Row;
  update?: Row;
  orderBy?: Row | Row[];
  cursor?: Row;
  take?: number;
  skip?: number;
  select?: Row;
};
const models = [
  "user",
  "childProfile",
  "avatar",
  "mission",
  "conversationSession",
  "conversationTurn",
  "aiProviderConfig",
  "xpEvent",
  "badge",
  "childBadge",
  "vocabularyItem",
  "safetyEvent",
] as const;
type Model = (typeof models)[number];
const at = new Date("2026-05-19T12:00:00Z");
export function memoryPrisma() {
  let tables = Object.fromEntries(models.map((name) => [name, [] as Row[]])) as Record<
    Model,
    Row[]
  >;
  tables.user.push(
    {
      id: "demo-adult",
      email: "demo@talkytown.local",
      displayAlias: "Demo Tutor",
      role: "adult",
      createdAt: at,
      updatedAt: at,
    },
    {
      id: "other-adult",
      email: "other@talkytown.local",
      displayAlias: "Other Tutor",
      role: "adult",
      createdAt: at,
      updatedAt: at,
    },
  );
  tables.avatar.push({
    id: "luna-id",
    code: "luna",
    name: "Luna",
    personality: "Patient",
    isActive: true,
    createdAt: at,
    updatedAt: at,
  });
  tables.mission.push(
    ...[
      ["meet-a-new-friend", 5, 7, 25],
      ["animal-adventure", 5, 10, 30],
      ["ice-cream-shop", 8, 12, 40],
      ["space-explorer", 8, 12, 50],
    ].map(([code, minAge, maxAge, xpReward], index) => ({
      id: `mission-${code}`,
      code,
      minAge,
      maxAge,
      xpReward,
      title: code,
      description: "Practice English",
      isActive: true,
      sortOrder: index,
      updatedAt: at,
      createdAt: at,
    })),
  );
  tables.badge.push(
    ...["first-talk", "animal-explorer", "kind-corrector", "three-day-streak", "mission-hero"].map(
      (code) => ({ id: `badge-${code}`, code, title: code, xpRequired: 5 }),
    ),
  );
  tables.aiProviderConfig.push(
    ...["demo-adult", "other-adult"].map((userId) => ({
      id: `provider-${userId}`,
      userId,
      providerType: "mock",
      model: "talkytown-mock",
      baseUrl: null,
      isActive: true,
      updatedAt: at,
      createdAt: at,
    })),
  );
  const related = (model: Model, row: Row): Row => {
    if (model === "childProfile")
      return {
        ...row,
        avatar: tables.avatar.find((item) => item.id === row.avatarId) ?? null,
        xpEvents: tables.xpEvent.filter((item) => item.childProfileId === row.id),
      };
    if (model === "conversationSession")
      return {
        ...row,
        avatar: tables.avatar.find((item) => item.id === row.avatarId) ?? null,
        mission: tables.mission.find((item) => item.id === row.missionId) ?? null,
        childProfile: tables.childProfile.find((item) => item.id === row.childProfileId),
        xpEvents: tables.xpEvent.filter((item) => item.sessionId === row.id),
        turns: ordered(
          tables.conversationTurn.filter((item) => item.sessionId === row.id),
          [{ createdAt: "asc" }, { id: "asc" }],
        ),
      };
    if (model === "conversationTurn") {
      const session = tables.conversationSession.find((item) => item.id === row.sessionId);
      return {
        ...row,
        session: session
          ? {
              ...session,
              childProfile: tables.childProfile.find((item) => item.id === session.childProfileId),
            }
          : null,
      };
    }
    if (model === "childBadge")
      return { ...row, badge: tables.badge.find((item) => item.id === row.badgeId) };
    return row;
  };
  function matches(row: Row, where: Row = {}): boolean {
    return Object.entries(where).every(([key, expected]) => {
      const value = row[key];
      if (expected && typeof expected === "object" && !(expected instanceof Date)) {
        const rule = expected as Row;
        if ("in" in rule) return (rule.in as unknown[]).includes(value);
        if ("lte" in rule || "gte" in rule || "gt" in rule)
          return (
            (!("lte" in rule) || Number(value) <= Number(rule.lte)) &&
            (!("gte" in rule) || Number(value) >= Number(rule.gte)) &&
            (!("gt" in rule) || Number(value) > Number(rule.gt))
          );
        if ("startsWith" in rule) return String(value).startsWith(String(rule.startsWith));
        if (key.includes("_") && value === undefined) return matches(row, rule);
        return Boolean(value && typeof value === "object" && matches(value as Row, rule));
      }
      return value === expected;
    });
  }
  function ordered(rows: Row[], orderBy?: Row | Row[]) {
    const orders = orderBy ? (Array.isArray(orderBy) ? orderBy : [orderBy]) : [];
    return [...rows].sort((left, right) => {
      for (const order of orders)
        for (const [key, direction] of Object.entries(order)) {
          const a =
            left[key] instanceof Date
              ? (left[key] as Date).getTime()
              : (left[key] as number | string);
          const b =
            right[key] instanceof Date
              ? (right[key] as Date).getTime()
              : (right[key] as number | string);
          if (a < b) return direction === "desc" ? 1 : -1;
          if (a > b) return direction === "desc" ? -1 : 1;
        }
      return 0;
    });
  }
  const conflict = () =>
    new Prisma.PrismaClientKnownRequestError("Controlled test conflict", {
      code: "P2002",
      clientVersion: "test",
    });
  const delegates = Object.fromEntries(
    models.map((model) => {
      const findMany = async (query: Query = {}) => {
        let rows = ordered(
          tables[model]
            .map((row) => related(model, row))
            .filter((row) => matches(row, query.where)),
          query.orderBy,
        );
        if (query.cursor)
          rows = rows.slice(
            rows.findIndex((row) => matches(row, query.cursor)) + (query.skip ?? 0),
          );
        if (query.take !== undefined) rows = rows.slice(0, query.take);
        return rows.map((row) =>
          query.select
            ? Object.fromEntries(
                Object.keys(query.select)
                  .filter((key) => query.select?.[key])
                  .map((key) => [key, row[key]]),
              )
            : row,
        );
      };
      const findFirst = async (query: Query = {}) => (await findMany(query))[0] ?? null;
      const create = async (query: Query) => {
        const data = query.data ?? {};
        const row: Row = {
          id: randomUUID(),
          createdAt: new Date(at),
          updatedAt: new Date(at),
          ...(model === "childProfile"
            ? { ageBand: "8-10", level: "starter", xpTotal: 0, streakDays: 0 }
            : {}),
          ...(model === "conversationSession"
            ? { status: "active", missionId: null, missionProgress: 0, xpEarned: 0, endedAt: null }
            : {}),
          ...(model === "conversationTurn"
            ? {
                inputMode: "text",
                xpAwarded: 0,
                correctionNeeded: false,
                correctedContent: null,
                correctionExplanation: null,
              }
            : {}),
          ...data,
        };
        if (
          tables[model].some(
            (item) =>
              item.id === row.id ||
              (model === "childProfile" &&
                item.userId === row.userId &&
                item.alias === row.alias) ||
              (model === "childBadge" &&
                item.childProfileId === row.childProfileId &&
                item.badgeId === row.badgeId) ||
              (model === "vocabularyItem" &&
                item.childProfileId === row.childProfileId &&
                item.language === row.language &&
                item.normalizedTerm === row.normalizedTerm),
          )
        )
          throw conflict();
        tables[model].push(row);
        return related(model, row);
      };
      const apply = (row: Row, data: Row = {}) => {
        for (const [key, value] of Object.entries(data))
          row[key] =
            value && typeof value === "object" && "increment" in value
              ? Number(row[key] ?? 0) + Number((value as Row).increment)
              : value;
        row.updatedAt = new Date();
        return related(model, row);
      };
      const update = async (query: Query) => {
        const row = tables[model].find((item) => matches(related(model, item), query.where));
        if (!row)
          throw new Prisma.PrismaClientKnownRequestError("Controlled test missing row", {
            code: "P2025",
            clientVersion: "test",
          });
        return apply(row, query.data);
      };
      return [
        model,
        {
          findMany,
          findFirst,
          findUnique: findFirst,
          findFirstOrThrow: async (query: Query) => {
            const row = await findFirst(query);
            if (!row) throw new Error("Fixture missing");
            return row;
          },
          findUniqueOrThrow: async (query: Query) => {
            const row = await findFirst(query);
            if (!row) throw new Error("Fixture missing");
            return row;
          },
          create,
          update,
          updateMany: async (query: Query) => {
            const rows = tables[model].filter((row) => matches(row, query.where));
            rows.forEach((row) => apply(row, query.data));
            return { count: rows.length };
          },
          upsert: async (query: Query) => {
            const row = await findFirst(query);
            return row
              ? update({ where: query.where, data: query.update })
              : create({ data: query.create });
          },
          aggregate: async (query: Query) => ({
            _sum: {
              amount: (await findMany(query)).reduce((sum, row) => sum + Number(row.amount), 0),
            },
          }),
        },
      ];
    }),
  );
  const database = {
    ...delegates,
    $queryRaw: async (_query: TemplateStringsArray, ...values: unknown[]) => [{ id: values[0] }],
    $transaction: async (callback: (db: Prisma.TransactionClient) => Promise<unknown>) => {
      const snapshot = structuredClone(tables);
      try {
        return await callback(database as unknown as Prisma.TransactionClient);
      } catch (error) {
        tables = snapshot;
        throw error;
      }
    },
    $disconnect: async () => {},
  };
  return { db: database as unknown as PrismaService, rows: (model: Model) => tables[model] };
}
