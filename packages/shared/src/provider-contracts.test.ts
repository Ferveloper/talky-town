import { expect, it } from "vitest";
import type {
  ProviderCatalogResponse,
  ProviderTestResponse,
  UpdateProviderConfigRequest,
} from "./index";
it("keeps provider HTTP contracts non-secret and test results content-free", () => {
  const input: UpdateProviderConfigRequest = {
    baseUrl: "http://localhost:11434/v1",
    model: "test",
  };
  const result: ProviderTestResponse = {
    providerType: "local-openai-compatible",
    model: "test",
    available: true,
    latencyMs: 12,
  };
  const catalog: ProviderCatalogResponse = {
    activeProvider: null,
    selectionError: "PROVIDER_CONFIGURATION_INVALID",
    items: [],
  };
  expect(input).not.toHaveProperty("apiKey");
  expect(result).not.toHaveProperty("reply");
  expect(catalog.activeProvider).toBeNull();
});
