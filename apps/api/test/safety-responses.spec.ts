import { describe, expect, it } from "vitest";
import { isSafetyResponse, safetyResponse } from "../src/safety/safety-responses";
import { SAFE_REDIRECTION, screenText, type SafetyTemplate } from "../src/safety/safety-rules";
describe("reviewed deterministic safety responses", () => {
  it.each(["5-7", "8-10", "11-12"] as const)("provides screened support for %s", (age) => {
    for (const template of [
      "self-harm",
      "bullying",
      "distress",
      "redirect",
      "relationship",
    ] as SafetyTemplate[]) {
      const reply = safetyResponse(template, age);
      expect(reply.length).toBeLessThanOrEqual(2000);
      expect(isSafetyResponse(reply)).toBe(true);
      expect(screenText(reply, { source: "provider-output" }).flagged).toBe(false);
    }
    expect(safetyResponse("self-harm", age)).toContain("adulto de confianza");
    expect(safetyResponse("self-harm", age)).toContain("ayuda urgente");
    expect(safetyResponse("bullying", age)).toContain("No es tu culpa");
  });
  it("keeps the existing ordinary response at ages 8–10", () => {
    expect(safetyResponse("redirect", "8-10")).toBe(SAFE_REDIRECTION);
    expect(isSafetyResponse(SAFE_REDIRECTION + " child@example.test")).toBe(false);
  });
});
