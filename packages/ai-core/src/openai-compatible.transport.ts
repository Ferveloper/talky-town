import type { AiProviderType } from "@talkytown/shared";
import type { ChatMessage } from "./conversation-prompt";
export type OpenAiRuntimeConfig = {
  providerType: Exclude<AiProviderType, "mock">;
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
  responseMaxBytes: number;
};
export type ChatCompletionBody = {
  model: string;
  messages: ChatMessage[];
  stream: false;
  temperature: number;
  max_tokens: number;
};
export abstract class OpenAiCompatibleTransport {
  abstract complete(
    config: OpenAiRuntimeConfig,
    body: ChatCompletionBody,
    signal: AbortSignal,
  ): Promise<unknown>;
}
