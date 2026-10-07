import { expect, it } from "vitest";
import { OpenAiCompatibleProvider } from "./openai-compatible.provider";
it("sanitizes raw transport failures before they can reach callers", async () => {
  const provider = new OpenAiCompatibleProvider(
    {
      providerType: "openai-compatible-cloud",
      baseUrl: "https://trusted.test/v1",
      model: "model",
      apiKey: "secret",
      timeoutMs: 100,
      responseMaxBytes: 1000,
    },
    {
      complete: async () => {
        throw new Error("secret private input raw upstream body");
      },
    },
  );
  try {
    await provider.generateConversationReply({
      ageBand: "8-10",
      learningLevel: "starter",
      mode: "free-talk",
      message: "dog",
    });
    throw new Error("Expected failure");
  } catch (error) {
    expect(error).toMatchObject({ message: "PROVIDER_UNAVAILABLE", code: "PROVIDER_UNAVAILABLE" });
    expect(JSON.stringify(error)).not.toContain("secret");
  }
});
