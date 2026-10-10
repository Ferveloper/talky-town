import { Injectable } from "@nestjs/common";
import { Agent } from "undici";
import {
  OpenAiCompatibleTransport,
  ProviderExecutionError,
  type OpenAiRuntimeConfig,
  type ChatCompletionBody,
} from "@talkytown/ai-core";
import { ProviderUrlPolicyService } from "./provider-url-policy.service";
@Injectable()
export class SafeFetchTransport extends OpenAiCompatibleTransport {
  constructor(private readonly policy: ProviderUrlPolicyService) {
    super();
  }
  override async complete(
    config: OpenAiRuntimeConfig,
    body: ChatCompletionBody,
    signal: AbortSignal,
  ): Promise<unknown> {
    let agent: Agent | undefined;
    try {
      const target = await this.policy.authorize(config.providerType, config.baseUrl, signal);
      const address = target.addresses[0]!;
      agent = new Agent({
        connect: {
          autoSelectFamily: false,
          timeout: Math.min(config.timeoutMs, 10000),
          lookup: (_host, _options, callback) => callback(null, address.address, address.family),
        },
      });
      const options: RequestInit & { dispatcher: Agent } = {
        method: "POST",
        redirect: "manual",
        signal,
        dispatcher: agent,
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: "Bearer " + config.apiKey } : {}),
        },
        body: JSON.stringify(body),
      };
      const response = await fetch(target.url, options);
      if (!response.ok) {
        await response.body?.cancel();
        const code =
          response.status === 401 || response.status === 403
            ? "PROVIDER_AUTHENTICATION_FAILED"
            : response.status === 429
              ? "PROVIDER_RATE_LIMITED"
              : response.status >= 500
                ? "PROVIDER_UNAVAILABLE"
                : response.status >= 300 && response.status < 400
                  ? "PROVIDER_URL_NOT_ALLOWED"
                  : "PROVIDER_REQUEST_REJECTED";
        throw new ProviderExecutionError(code);
      }
      if (Number(response.headers.get("content-length")) > config.responseMaxBytes) {
        await response.body?.cancel();
        throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
      }
      if (!response.body) throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        bytes += result.value.byteLength;
        if (bytes > config.responseMaxBytes) {
          await reader.cancel();
          throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
        }
        chunks.push(result.value);
      }
      try {
        return JSON.parse(Buffer.concat(chunks).toString("utf8"));
      } catch {
        throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
      }
    } catch (error) {
      if (signal.aborted) throw new ProviderExecutionError("PROVIDER_TIMEOUT");
      throw error instanceof ProviderExecutionError
        ? error
        : new ProviderExecutionError("PROVIDER_UNAVAILABLE");
    } finally {
      await agent?.destroy();
    }
  }
}
