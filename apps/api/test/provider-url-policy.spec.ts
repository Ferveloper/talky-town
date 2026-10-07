import { describe, expect, it, vi } from "vitest";
import {
  ProviderDnsResolver,
  ProviderUrlPolicyService,
} from "../src/ai-providers/provider-url-policy.service";
import type { AiRuntimePolicy } from "../src/config/ai-runtime-policy";
const policy: AiRuntimePolicy = {
  cloudOrigins: ["https://trusted.test", "https://127.0.0.1", "https://[::ffff:127.0.0.1]"],
  localHosts: [{ host: "localhost", ports: [11434], addresses: ["127.0.0.1/32", "::1/128"] }],
  cloudTimeoutMs: 100,
  localTimeoutMs: 100,
  responseMaxBytes: 65536,
};
describe("SSRF destination policy", () => {
  it.each([
    "http://trusted.test/v1",
    "https://other.test/v1",
    "https://key:secret@trusted.test/v1",
    "https://trusted.test/v1?key=secret",
    "https://trusted.test/v1#secret",
    "https://127.0.0.1/v1",
    "https://[::ffff:127.0.0.1]/v1",
    "https://trusted.test/v1%2fsecret",
  ])("rejects forbidden cloud target %s", (url) => {
    expect(() =>
      new ProviderUrlPolicyService(policy, new ProviderDnsResolver()).normalize(
        "openai-compatible-cloud",
        url,
      ),
    ).toThrow("PROVIDER_URL_NOT_ALLOWED");
  });
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "::1",
    "fe80::1",
    "::ffff:192.168.1.1",
    "224.0.0.1",
    "0.0.0.0",
  ])("rejects forbidden DNS address %s", async (address) => {
    const dns = {
      lookup: vi.fn().mockResolvedValue([{ address, family: address.includes(":") ? 6 : 4 }]),
    };
    await expect(
      new ProviderUrlPolicyService(policy, dns).authorize(
        "openai-compatible-cloud",
        "https://trusted.test/v1",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toThrow("PROVIDER_URL_NOT_ALLOWED");
  });
  it("validates all DNS answers and returns the validated connection targets", async () => {
    const dns = {
      lookup: vi
        .fn()
        .mockResolvedValueOnce([{ address: "8.8.8.8", family: 4 }])
        .mockResolvedValueOnce([
          { address: "8.8.8.8", family: 4 },
          { address: "127.0.0.1", family: 4 },
        ]),
    };
    const service = new ProviderUrlPolicyService(policy, dns);
    expect(
      await service.authorize(
        "openai-compatible-cloud",
        "https://trusted.test/v1/",
        AbortSignal.timeout(1000),
      ),
    ).toEqual({
      url: "https://trusted.test/v1/chat/completions",
      addresses: [{ address: "8.8.8.8", family: 4 }],
    });
    await expect(
      service.authorize(
        "openai-compatible-cloud",
        "https://trusted.test/v1",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toThrow("PROVIDER_URL_NOT_ALLOWED");
  });
  it("requires allowed local host, port and IP range", async () => {
    const dns = { lookup: vi.fn().mockResolvedValue([{ address: "127.0.0.1", family: 4 }]) };
    const service = new ProviderUrlPolicyService(policy, dns);
    expect(
      (
        await service.authorize(
          "local-openai-compatible",
          "http://localhost:11434/v1",
          AbortSignal.timeout(1000),
        )
      ).url,
    ).toContain("chat/completions");
    expect(() =>
      service.normalize("local-openai-compatible", "http://localhost:5432/v1"),
    ).toThrow();
    dns.lookup.mockResolvedValue([{ address: "10.0.0.1", family: 4 }]);
    await expect(
      service.authorize(
        "local-openai-compatible",
        "http://localhost:11434/v1",
        AbortSignal.timeout(1000),
      ),
    ).rejects.toThrow("PROVIDER_URL_NOT_ALLOWED");
  });
});
