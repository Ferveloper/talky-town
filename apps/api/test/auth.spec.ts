import { describe, expect, it } from "vitest";
import { validateApiConfig } from "../src/config/api-config";
describe("explicit runtime configuration", () => {
  it("requires JWT_SECRET and mandatory safety without creating secrets", () => {
    expect(() => validateApiConfig({})).toThrow(/JWT_SECRET/);
    expect(() => validateApiConfig({ JWT_SECRET: "short" })).toThrow(/JWT_SECRET/);
    const config = { JWT_SECRET: "test-secret-with-at-least-32-characters" };
    expect(validateApiConfig(config).JWT_SECRET).toBe(config.JWT_SECRET);
    expect(() => validateApiConfig({ ...config, ENABLE_SAFETY_GUARDRAILS: "false" })).toThrow(
      /mandatory/,
    );
    expect(() => validateApiConfig({ ...config, STORE_RAW_AUDIO: "true" })).toThrow(/unsupported/);
    expect(
      validateApiConfig({ ...config, AI_PROVIDER: "local-openai-compatible" }).JWT_SECRET,
    ).toBe(config.JWT_SECRET);
  });
});
