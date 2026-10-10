import type { AiProviderType } from "./index";
export type UpdateProviderConfigRequest = { baseUrl: string; model: string };
export type ProviderConfigResponse = {
  providerType: AiProviderType;
  baseUrl: string | null;
  model: string | null;
  active: boolean;
  configured: boolean;
  credentialsConfigured: boolean;
  configurationError?: string;
};
export type ProviderCatalogResponse = {
  activeProvider: AiProviderType | null;
  selectionError?: string;
  items: (ProviderConfigResponse & { executable: boolean; activatable: boolean })[];
};
export type ProviderTestResponse = {
  providerType: AiProviderType;
  model: string;
  available: true;
  latencyMs: number;
};
