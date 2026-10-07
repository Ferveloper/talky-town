import { expect, it } from "vitest";
import { loadRuntimePolicy, parseRuntimePolicy } from "../src/config/ai-runtime-policy";
import { validateApiConfig } from "../src/config/api-config";
it("loads an explicit non-secret policy with no cloud credential destinations by default", () => {
  const policy = loadRuntimePolicy();
  expect(policy.cloudOrigins).toEqual([]);
  expect(policy.localHosts.map((entry) => entry.host)).toContain("localhost");
  expect(() => parseRuntimePolicy({ ...policy, localTimeoutMs: -1 })).toThrow(
    "Invalid AI runtime policy.",
  );
  expect(() =>
    parseRuntimePolicy({ ...policy, cloudOrigins: ["http://untrusted.test"] }),
  ).toThrow();
  expect(() => parseRuntimePolicy({ ...policy, apiKey: "secret" })).toThrow();
});
it("rejects invalid credential configuration without including the secret", () => {
  expect(() =>
    validateApiConfig({ JWT_SECRET: "x".repeat(32), AI_CLOUD_API_KEY: "private\r\nvalue" }),
  ).toThrow("Invalid AI credential configuration.");
});
