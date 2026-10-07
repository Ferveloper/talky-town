import { Injectable } from "@nestjs/common";
import type { AiProviderConfig, Prisma } from "@prisma/client";
import {
  MockAiProvider,
  type AiConversationResponse,
  type ConversationRequest,
} from "@talkytown/ai-core";
import type { AiProviderType, ProviderCatalogResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../common/api-error";
const providerTypes: AiProviderType[] = [
  "mock",
  "openai-compatible-cloud",
  "local-openai-compatible",
];
export function providerFingerprint(config: AiProviderConfig): string {
  return JSON.stringify([
    config.id,
    config.providerType,
    config.model,
    config.baseUrl,
    config.updatedAt.toISOString(),
  ]);
}
@Injectable()
export class AiProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mock: MockAiProvider,
  ) {}
  async selected(
    userId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<AiProviderConfig> {
    const active = await db.aiProviderConfig.findMany({ where: { userId, isActive: true } });
    if (active.length !== 1) fail(422, "PROVIDER_CONFIGURATION_INVALID");
    const config = active[0]!;
    if (config.providerType !== "mock") fail(422, "PROVIDER_NOT_IMPLEMENTED");
    if (config.baseUrl !== null || (config.model !== null && config.model !== "talkytown-mock"))
      fail(422, "PROVIDER_CONFIGURATION_INVALID");
    return config;
  }
  async list(userId: string): Promise<ProviderCatalogResponse> {
    const active = await this.selected(userId);
    return {
      activeProvider: active.providerType as AiProviderType,
      items: providerTypes.map((providerType) => ({
        providerType,
        executable: providerType === "mock",
        activatable: providerType === "mock",
        active: providerType === active.providerType,
      })),
    };
  }
  async activate(userId: string, providerType: AiProviderType) {
    if (providerType !== "mock") fail(422, "PROVIDER_NOT_IMPLEMENTED");
    await this.prisma.$transaction(async (db) => {
      const users = await db.$queryRaw<
        { id: string }[]
      >`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
      if (!users.length) fail(401, "UNAUTHORIZED");
      await db.aiProviderConfig.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await db.aiProviderConfig.upsert({
        where: { userId_providerType: { userId, providerType: "mock" } },
        create: {
          userId,
          providerType: "mock",
          isActive: true,
          model: "talkytown-mock",
          baseUrl: null,
        },
        update: { isActive: true, model: "talkytown-mock", baseUrl: null },
      });
    });
    return this.list(userId);
  }
  async generate(input: ConversationRequest): Promise<AiConversationResponse> {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const output = await Promise.race([
        this.mock.generateConversationReply(input),
        new Promise<never>((_resolve, reject) => {
          timeout = setTimeout(() => reject(new Error("PROVIDER_TIMEOUT")), 3000);
        }),
      ]);
      if (
        !output ||
        typeof output.reply !== "string" ||
        !output.reply.trim() ||
        output.reply.length > 2000 ||
        !Array.isArray(output.newVocabulary) ||
        output.newVocabulary.length > 30 ||
        output.newVocabulary.some((word) => typeof word !== "string" || word.length > 80) ||
        typeof output.safety?.flagged !== "boolean" ||
        !["happy", "thinking", "celebrating", "encouraging"].includes(output.avatarEmotion) ||
        (output.correction !== undefined &&
          (typeof output.correction.needed !== "boolean" ||
            [
              output.correction.original,
              output.correction.corrected,
              output.correction.explanation,
            ].some(
              (text) => text !== undefined && (typeof text !== "string" || text.length > 2000),
            ) ||
            (output.correction.needed && !output.correction.corrected)))
      ) {
        throw new Error("INVALID_PROVIDER_RESPONSE");
      }
      return output;
    } catch {
      // Valid Mock selection already resolved by caller. This is a local generation error response, not adapter fallback.
      return {
        reply: "Let's keep practicing. What animal do you like?",
        newVocabulary: [],
        avatarEmotion: "encouraging",
        safety: { flagged: false },
      };
    } finally {
      if (timeout) clearTimeout(timeout);
    }
  }
}
