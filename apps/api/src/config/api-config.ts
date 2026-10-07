export function validateApiConfig(config: Record<string, unknown>): Record<string, unknown> {
  const secret = config.JWT_SECRET;
  if (typeof secret !== "string" || secret.trim().length < 32) {
    throw new Error("JWT_SECRET must be explicitly configured with at least 32 characters.");
  }
  if (config.ENABLE_SAFETY_GUARDRAILS === "false")
    throw new Error("Safety guardrails are mandatory.");
  if (config.STORE_RAW_AUDIO === "true") throw new Error("Raw audio storage is unsupported.");
  const port = Number(config.API_PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid API_PORT.");
  if (
    config.DEMO_AUTH_ENABLED !== undefined &&
    !["true", "false"].includes(String(config.DEMO_AUTH_ENABLED))
  ) {
    throw new Error("DEMO_AUTH_ENABLED must be true or false.");
  }
  return { ...config, API_PORT: port, DEMO_AUTH_ENABLED: config.DEMO_AUTH_ENABLED ?? "true" };
}
