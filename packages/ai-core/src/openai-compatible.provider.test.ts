import { describe, expect, it, vi } from "vitest";
import { OpenAiCompatibleProvider } from "./openai-compatible.provider";
import { ProviderExecutionError } from "./provider-errors";
import type { OpenAiRuntimeConfig } from "./openai-compatible.transport";
const config: OpenAiRuntimeConfig = {
  providerType: "local-openai-compatible",
  baseUrl: "http://localhost:11434/v1",
  model: "test-model",
  timeoutMs: 1000,
  responseMaxBytes: 65536,
};
const input = {
  ageBand: "8-10" as const,
  learningLevel: "starter" as const,
  mode: "free-talk" as const,
  message: "dog",
};
const good = {
  choices: [
    {
      index: 0,
      finish_reason: "stop",
      message: {
        role: "assistant",
        content: JSON.stringify({
          reply: "Nice dog!",
          newVocabulary: [],
          avatarEmotion: "happy",
          safety: { flagged: false },
        }),
      },
    },
  ],
};
describe("shared real protocol adapter", () => {
  it("repairs once using same configured model and validates final output", async () => {
    const complete = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce(good);
    expect(
      (await new OpenAiCompatibleProvider(config, { complete }).generateConversationReply(input))
        .reply,
    ).toBe("Nice dog!");
    expect(complete).toHaveBeenCalledTimes(2);
    for (const call of complete.mock.calls)
      expect(call[1]).toMatchObject({ model: "test-model", stream: false });
    expect(complete.mock.calls[1]![1].messages[0].content).toContain("fresh response");
  });
  it("fails after exactly two malformed attempts", async () => {
    const complete = vi.fn().mockResolvedValue({});
    await expect(
      new OpenAiCompatibleProvider(config, { complete }).generateConversationReply(input),
    ).rejects.toThrow("PROVIDER_INVALID_RESPONSE");
    expect(complete).toHaveBeenCalledTimes(2);
  });
  it.each([
    "PROVIDER_AUTHENTICATION_FAILED",
    "PROVIDER_RATE_LIMITED",
    "PROVIDER_UNAVAILABLE",
  ] as const)("does not retry %s or switch provider", async (code) => {
    const complete = vi.fn().mockRejectedValue(new ProviderExecutionError(code));
    await expect(
      new OpenAiCompatibleProvider(config, { complete }).generateConversationReply(input),
    ).rejects.toThrow(code);
    expect(complete).toHaveBeenCalledTimes(1);
  });
});
