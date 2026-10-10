import type { AiProvider, AiConversationResponse, ConversationRequest } from "./index";
import { composeConversationPrompt } from "./conversation-prompt";
import { parseAiResponse } from "./ai-response.parser";
import { ProviderExecutionError } from "./provider-errors";
import { OpenAiCompatibleTransport, type OpenAiRuntimeConfig } from "./openai-compatible.transport";
export class OpenAiCompatibleProvider implements AiProvider {
  readonly id: string;
  readonly name = "OpenAI-compatible provider";
  constructor(
    private readonly config: OpenAiRuntimeConfig,
    private readonly transport: OpenAiCompatibleTransport,
  ) {
    this.id = config.providerType;
  }
  async generateConversationReply(input: ConversationRequest): Promise<AiConversationResponse> {
    const deadline = Date.now() + this.config.timeoutMs * 2;
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new ProviderExecutionError("PROVIDER_TIMEOUT");
      const signal = AbortSignal.timeout(Math.min(this.config.timeoutMs, remaining));
      try {
        const envelope = await this.transport.complete(
          this.config,
          {
            model: this.config.model,
            messages: composeConversationPrompt(input, attempt > 0),
            stream: false,
            temperature: 0.2,
            max_tokens: 512,
          },
          signal,
        );
        return parseAiResponse(envelope, input.message);
      } catch (error) {
        if (signal.aborted) throw new ProviderExecutionError("PROVIDER_TIMEOUT");
        if (
          error instanceof ProviderExecutionError &&
          error.code === "PROVIDER_INVALID_RESPONSE" &&
          attempt === 0
        )
          continue;
        throw error instanceof ProviderExecutionError
          ? error
          : new ProviderExecutionError("PROVIDER_UNAVAILABLE");
      }
    }
    throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
  }
}
