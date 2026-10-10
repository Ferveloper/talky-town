export function validateApiConfig(config: Record<string, unknown>): Record<string, unknown> {
  const secret = config.JWT_SECRET;
  for (const key of ["AI_CLOUD_API_KEY", "AI_LOCAL_API_KEY"]) {
    if (
      config[key] !== undefined &&
      (typeof config[key] !== "string" ||
        /[\r\n]/.test(String(config[key])) ||
        String(config[key]).trim().length > 4096)
    )
      throw new Error("Invalid AI credential configuration.");
  }
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
