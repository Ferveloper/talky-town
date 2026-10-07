import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  MockAiProvider,
  OpenAiCompatibleProvider,
  OpenAiCompatibleTransport,
  type AiProvider,
} from "@talkytown/ai-core";
import type { AiProviderType } from "@talkytown/shared";
import { fail } from "../common/api-error";
import { AI_RUNTIME_POLICY, type AiRuntimePolicy } from "../config/ai-runtime-policy";
import { ProviderUrlPolicyService } from "./provider-url-policy.service";
export const providerTypes = [
  "mock",
  "openai-compatible-cloud",
  "local-openai-compatible",
] as const;
export function providerType(value: string): AiProviderType {
  const type = providerTypes.find((type) => type === value);
  if (!type) fail(422, "PROVIDER_CONFIGURATION_INVALID");
  return type;
}
export type ResolvedProvider = {
  id: string;
  providerType: AiProviderType;
  model: string;
  baseUrl: string | null;
};
@Injectable()
export class AiProviderRegistry {
  constructor(
    private readonly mock: MockAiProvider,
    private readonly transport: OpenAiCompatibleTransport,
    private readonly config: ConfigService,
    private readonly urls: ProviderUrlPolicyService,
    @Inject(AI_RUNTIME_POLICY) readonly policy: AiRuntimePolicy,
  ) {}
  credentialsConfigured(type: AiProviderType): boolean {
    return (
      type === "mock" ||
      Boolean(
        this.config
          .get<string>(type === "openai-compatible-cloud" ? "AI_CLOUD_API_KEY" : "AI_LOCAL_API_KEY")
          ?.trim(),
      )
    );
  }
  resolve(
    config: { id: string; providerType: string; model: string | null; baseUrl: string | null },
    pinnedModel?: string,
    requireCredentials = true,
  ): ResolvedProvider {
    const type = providerType(config.providerType);
    const model = pinnedModel ?? config.model;
    if (type === "mock") {
      if (config.baseUrl !== null || (model !== null && model !== "talkytown-mock"))
        fail(422, "PROVIDER_CONFIGURATION_INVALID");
      return { id: config.id, providerType: type, model: "talkytown-mock", baseUrl: null };
    }
    if (
      !model ||
      !config.baseUrl ||
      (requireCredentials &&
        type === "openai-compatible-cloud" &&
        !this.credentialsConfigured(type))
    )
      fail(422, "PROVIDER_NOT_CONFIGURED");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]{0,199}$/.test(model))
      fail(422, "PROVIDER_CONFIGURATION_INVALID");
    return {
      id: config.id,
      providerType: type,
      model,
      baseUrl: this.urls.normalize(type, config.baseUrl),
    };
  }
  runtime(selected: ResolvedProvider): AiProvider {
    if (selected.providerType === "mock") return this.mock;
    return new OpenAiCompatibleProvider(
      {
        providerType: selected.providerType,
        baseUrl: selected.baseUrl!,
        model: selected.model,
        apiKey:
          this.config
            .get<string>(
              selected.providerType === "openai-compatible-cloud"
                ? "AI_CLOUD_API_KEY"
                : "AI_LOCAL_API_KEY",
            )
            ?.trim() || undefined,
        timeoutMs:
          selected.providerType === "openai-compatible-cloud"
            ? this.policy.cloudTimeoutMs
            : this.policy.localTimeoutMs,
        responseMaxBytes: this.policy.responseMaxBytes,
      },
      this.transport,
    );
  }
}
