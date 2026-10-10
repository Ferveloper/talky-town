import { afterEach, expect, it, vi } from "vitest";
import { ProviderOperationLimiter } from "../src/ai-providers/provider-operation-limiter.service";
afterEach(() => vi.useRealTimers());
it("limits each adult independently, releases on failure and resets after a minute", async () => {
  vi.useFakeTimers();
  const limiter = new ProviderOperationLimiter();
  let resume!: () => void;
  const pending = limiter.run(
    "adult",
    () =>
      new Promise<void>((resolve) => {
        resume = resolve;
      }),
  );
  await expect(limiter.run("adult", async () => {})).rejects.toMatchObject({
    response: { code: "PROVIDER_OPERATION_RATE_LIMITED" },
  });
  await limiter.run("other", async () => {});
  resume();
  await pending;
  await expect(
    limiter.run("adult", async () => {
      throw new Error("failed");
    }),
  ).rejects.toThrow("failed");
  for (let i = 0; i < 3; i++) await limiter.run("adult", async () => {});
  await expect(limiter.run("adult", async () => {})).rejects.toMatchObject({
    response: { code: "PROVIDER_OPERATION_RATE_LIMITED" },
  });
  vi.advanceTimersByTime(60001);
  await limiter.run("adult", async () => {});
});
