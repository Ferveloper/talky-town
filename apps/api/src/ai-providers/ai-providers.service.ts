import { HttpException, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  ProviderExecutionError,
  validateAiResponse,
  type AiConversationResponse,
  type ConversationRequest,
} from "@talkytown/ai-core";
import type {
  AiProviderType,
  ProviderCatalogResponse,
  ProviderConfigResponse,
  ProviderTestResponse,
  UpdateProviderConfigRequest,
} from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { fail } from "../common/api-error";
import {
  AiProviderRegistry,
  providerType,
  providerTypes,
  type ResolvedProvider,
} from "./ai-provider-registry.service";
import { ProviderUrlPolicyService } from "./provider-url-policy.service";
import { ProviderOperationLimiter } from "./provider-operation-limiter.service";
export function providerFingerprint(config: ResolvedProvider): string {
  return JSON.stringify([config.id, config.providerType, config.model, config.baseUrl]);
}
function controlled(error: unknown): never {
  if (error instanceof ProviderExecutionError) {
    const status =
      error.code === "PROVIDER_TIMEOUT"
        ? 504
        : ["PROVIDER_UNAVAILABLE", "PROVIDER_RATE_LIMITED"].includes(error.code)
          ? 503
          : error.code === "PROVIDER_URL_NOT_ALLOWED"
            ? 422
            : 502;
    fail(status, error.code);
  }
  if (error instanceof HttpException) throw error;
  return fail(503, "PROVIDER_UNAVAILABLE");
}
@Injectable()
export class AiProvidersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AiProviderRegistry,
    private readonly urls: ProviderUrlPolicyService,
    private readonly limiter: ProviderOperationLimiter,
  ) {}
  async selected(
    userId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<ResolvedProvider> {
    const active = await db.aiProviderConfig.findMany({ where: { userId, isActive: true } });
    if (active.length !== 1) fail(422, "PROVIDER_CONFIGURATION_INVALID");
    try {
      return this.registry.resolve(active[0]!);
    } catch (error) {
      return controlled(error);
    }
  }
  async forSession(
    userId: string,
    session: { aiProviderType: string | null; aiModel: string | null },
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<ResolvedProvider> {
    if (!session.aiProviderType || !session.aiModel) fail(422, "PROVIDER_CONFIGURATION_INVALID");
    const type = providerType(session.aiProviderType);
    const config = await db.aiProviderConfig.findUnique({
      where: { userId_providerType: { userId, providerType: type } },
    });
    if (!config) fail(422, "PROVIDER_NOT_CONFIGURED");
    try {
      return this.registry.resolve(config, session.aiModel);
    } catch (error) {
      return controlled(error);
    }
  }
  private describe(
    type: AiProviderType,
    config?: {
      id: string;
      providerType: string;
      model: string | null;
      baseUrl: string | null;
      isActive: boolean;
    },
  ): ProviderConfigResponse {
    let configurationError: string | undefined;
    let metadata: ResolvedProvider | undefined;
    try {
      if (!config) fail(422, "PROVIDER_NOT_CONFIGURED");
      metadata = this.registry.resolve(config, undefined, false);
      if (type === "openai-compatible-cloud" && !this.registry.credentialsConfigured(type))
        configurationError = "PROVIDER_NOT_CONFIGURED";
    } catch (error) {
      configurationError =
        error instanceof ProviderExecutionError
          ? error.code
          : error instanceof HttpException
            ? (error.getResponse() as { code: string }).code
            : "PROVIDER_CONFIGURATION_INVALID";
    }
    // Invalid legacy metadata might contain embedded credentials; never echo it.
    return {
      providerType: type,
      baseUrl: metadata?.baseUrl ?? null,
      model: metadata?.model ?? null,
      active: config?.isActive ?? false,
      configured: !configurationError,
      credentialsConfigured: this.registry.credentialsConfigured(type),
      ...(configurationError ? { configurationError } : {}),
    };
  }
  async list(userId: string): Promise<ProviderCatalogResponse> {
    const configs = await this.prisma.aiProviderConfig.findMany({ where: { userId } });
    const active = configs.filter((config) => config.isActive);
    const validType =
      active.length === 1 && providerTypes.find((type) => type === active[0]!.providerType);
    return {
      activeProvider: validType || null,
      ...(!validType ? { selectionError: "PROVIDER_CONFIGURATION_INVALID" } : {}),
      items: providerTypes.map((type) => {
        const item = this.describe(
          type,
          configs.find((config) => config.providerType === type),
        );
        return { ...item, executable: true, activatable: item.configured };
      }),
    };
  }
  async activate(userId: string, type: AiProviderType) {
    await this.prisma.$transaction(async (db) => {
      await this.lockAdult(userId, db);
      let config = await db.aiProviderConfig.findUnique({
        where: { userId_providerType: { userId, providerType: type } },
      });
      if (type === "mock")
        config = await db.aiProviderConfig.upsert({
          where: { userId_providerType: { userId, providerType: type } },
          create: {
            userId,
            providerType: type,
            model: "talkytown-mock",
            baseUrl: null,
            isActive: false,
          },
          update: { model: "talkytown-mock", baseUrl: null },
        });
      if (!config) fail(422, "PROVIDER_NOT_CONFIGURED");
      try {
        this.registry.resolve(config);
      } catch (error) {
        controlled(error);
      }
      await db.aiProviderConfig.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false },
      });
      await db.aiProviderConfig.update({ where: { id: config.id }, data: { isActive: true } });
    });
    return this.list(userId);
  }
  private async lockAdult(userId: string, db: Prisma.TransactionClient) {
    const rows = await db.$queryRaw<
      { id: string }[]
    >`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
    if (!rows.length) fail(401, "UNAUTHORIZED");
  }
  async configure(
    userId: string,
    type: AiProviderType,
    input: UpdateProviderConfigRequest,
  ): Promise<ProviderConfigResponse> {
    if (type === "mock") fail(422, "PROVIDER_CONFIGURATION_INVALID");
    let baseUrl: string;
    try {
      baseUrl = this.urls.normalize(type, input.baseUrl);
      await this.urls.authorize(type, baseUrl, AbortSignal.timeout(10000));
    } catch (error) {
      return controlled(error);
    }
    const config = await this.prisma.$transaction(async (db) => {
      await this.lockAdult(userId, db);
      const existing = await db.aiProviderConfig.findUnique({
        where: { userId_providerType: { userId, providerType: type } },
      });
      if (existing && existing.baseUrl !== baseUrl) {
        const activeSessionCount = await db.conversationSession.count({
          where: { aiProviderType: type, status: "active", childProfile: { userId } },
        });
        if (activeSessionCount)
          throw new HttpException({ code: "PROVIDER_CONFIG_IN_USE", activeSessionCount }, 409);
      }
      return db.aiProviderConfig.upsert({
        where: { userId_providerType: { userId, providerType: type } },
        create: { userId, providerType: type, baseUrl, model: input.model, isActive: false },
        update: { baseUrl, model: input.model },
      });
    });
    return this.describe(type, config);
  }
  async test(userId: string, type: AiProviderType): Promise<ProviderTestResponse> {
    const config = await this.prisma.aiProviderConfig.findUnique({
      where: { userId_providerType: { userId, providerType: type } },
    });
    if (!config) fail(422, "PROVIDER_NOT_CONFIGURED");
    let selected: ResolvedProvider;
    try {
      selected = this.registry.resolve(config);
    } catch (error) {
      return controlled(error);
    }
    const started = Date.now();
    await this.execute(
      userId,
      selected,
      { ageBand: "8-10", learningLevel: "starter", mode: "free-talk", message: "I like dogs" },
      false,
    );
    const after = await this.prisma.aiProviderConfig.findUnique({ where: { id: config.id } });
    if (!after || after.baseUrl !== config.baseUrl || after.model !== config.model)
      fail(409, "PROVIDER_CONFIGURATION_CHANGED");
    return {
      providerType: type,
      model: selected.model,
      available: true,
      latencyMs: Math.max(0, Date.now() - started),
    };
  }
  generate(
    userId: string,
    selected: ResolvedProvider,
    input: ConversationRequest,
  ): Promise<AiConversationResponse> {
    return this.execute(userId, selected, input, true);
  }
  private async execute(
    userId: string,
    selected: ResolvedProvider,
    input: ConversationRequest,
    allowMockFallback: boolean,
  ): Promise<AiConversationResponse> {
    const run = async () => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const runtime = this.registry.runtime(selected);
        const output =
          selected.providerType === "mock"
            ? await Promise.race([
                runtime.generateConversationReply(input),
                new Promise<never>((_resolve, reject) => {
                  timer = setTimeout(
                    () => reject(new ProviderExecutionError("PROVIDER_TIMEOUT")),
                    3000,
                  );
                }),
              ])
            : await runtime.generateConversationReply(input);
        return validateAiResponse(output, input.message);
      } catch (error) {
        if (selected.providerType === "mock" && allowMockFallback)
          return {
            reply: "Let's keep practicing. What animal do you like?",
            newVocabulary: [],
            avatarEmotion: "encouraging" as const,
            safety: { flagged: false as const },
          };
        return controlled(error);
      } finally {
        if (timer) clearTimeout(timer);
      }
    };
    return selected.providerType === "mock" ? run() : this.limiter.run(userId, run);
  }
}
