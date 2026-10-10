import { Module } from "@nestjs/common";
import { MockAiProvider, OpenAiCompatibleTransport } from "@talkytown/ai-core";
import { AI_RUNTIME_POLICY, loadRuntimePolicy } from "../config/ai-runtime-policy";
import { AiProviderRegistry } from "./ai-provider-registry.service";
import { ProviderDnsResolver, ProviderUrlPolicyService } from "./provider-url-policy.service";
import { SafeFetchTransport } from "./safe-fetch-transport.service";
import { ProviderOperationLimiter } from "./provider-operation-limiter.service";
import { AiProvidersService } from "./ai-providers.service";
import { AiProvidersController } from "./ai-providers.controller";
@Module({
  controllers: [AiProvidersController],
  providers: [
    MockAiProvider,
    AiProvidersService,
    AiProviderRegistry,
    ProviderDnsResolver,
    ProviderUrlPolicyService,
    ProviderOperationLimiter,
    SafeFetchTransport,
    { provide: AI_RUNTIME_POLICY, useFactory: loadRuntimePolicy },
    { provide: OpenAiCompatibleTransport, useExisting: SafeFetchTransport },
  ],
  exports: [AiProvidersService],
})
export class AiProvidersModule {}
