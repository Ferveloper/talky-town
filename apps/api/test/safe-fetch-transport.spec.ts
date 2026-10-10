import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SafeFetchTransport } from "../src/ai-providers/safe-fetch-transport.service";
import { ProviderUrlPolicyService } from "../src/ai-providers/provider-url-policy.service";
import { fakeOpenAiServer } from "./helpers/fake-openai-server";
import type { ChatCompletionBody, OpenAiRuntimeConfig } from "@talkytown/ai-core";
describe("native fetch transport", () => {
  let fake: Awaited<ReturnType<typeof fakeOpenAiServer>>;
  let transport: SafeFetchTransport;
  let config: OpenAiRuntimeConfig;
  const body: ChatCompletionBody = {
    model: "test",
    messages: [{ role: "user", content: "dog" }],
    stream: false,
    temperature: 0.2,
    max_tokens: 512,
  };
  beforeEach(async () => {
    fake = await fakeOpenAiServer();
    const dns = { lookup: vi.fn().mockResolvedValue([{ address: "127.0.0.1", family: 4 }]) };
    // Host is deliberately not resolvable through public DNS. Dispatcher must use the validated IP.
    const policy = {
      ...fake.policy,
      localHosts: [{ host: "runtime.invalid", ports: [fake.port], addresses: ["127.0.0.1/32"] }],
    };
    transport = new SafeFetchTransport(new ProviderUrlPolicyService(policy, dns));
    config = {
      providerType: "local-openai-compatible",
      baseUrl: `http://runtime.invalid:${fake.port}/v1`,
      model: "test",
      timeoutMs: 1000,
      responseMaxBytes: 65536,
    };
  });
  afterEach(async () => {
    await fake.close();
    vi.restoreAllMocks();
  });
  it("pins DNS to validated address and sends optional local bearer only when configured", async () => {
    await transport.complete(config, body, AbortSignal.timeout(1000));
    await transport.complete(
      { ...config, apiKey: "test-only-key" },
      body,
      AbortSignal.timeout(1000),
    );
    expect(fake.requests.map((req) => req.path)).toEqual([
      "/v1/chat/completions",
      "/v1/chat/completions",
    ]);
    expect(fake.requests[0]!.authorization).toBeUndefined();
    expect(fake.requests[1]!.authorization).toBe("Bearer test-only-key");
  });
  it.each([
    [401, "PROVIDER_AUTHENTICATION_FAILED"],
    [403, "PROVIDER_AUTHENTICATION_FAILED"],
    [429, "PROVIDER_RATE_LIMITED"],
    [500, "PROVIDER_UNAVAILABLE"],
    [400, "PROVIDER_REQUEST_REJECTED"],
    [302, "PROVIDER_URL_NOT_ALLOWED"],
  ] as const)("maps HTTP %s without returning upstream content", async (status, code) => {
    fake.state.status = status;
    await expect(transport.complete(config, body, AbortSignal.timeout(1000))).rejects.toThrow(code);
    expect(fake.requests).toHaveLength(1);
  });
  it("cancels a stalled request and rejects oversized bodies", async () => {
    fake.state.delayMs = 100;
    await expect(transport.complete(config, body, AbortSignal.timeout(20))).rejects.toThrow(
      "PROVIDER_TIMEOUT",
    );
    fake.state.delayMs = 0;
    await expect(
      transport.complete({ ...config, responseMaxBytes: 10 }, body, AbortSignal.timeout(1000)),
    ).rejects.toThrow("PROVIDER_INVALID_RESPONSE");
  });
});
