import { describe, expect, it } from "vitest";
import { validateAiResponse } from "./ai-response.parser";
const response = {
  reply: "Great!",
  newVocabulary: [],
  avatarEmotion: "happy",
  safety: { flagged: false },
};
describe("strict pedagogical response", () => {
  it.each([
    { ...response, xp: 100 },
    { ...response, missionProgress: 100 },
    { ...response, badges: [] },
    { ...response, safety: { flagged: false, reason: "other" } },
    { ...response, safety: { flagged: true } },
    { ...response, safety: { flagged: true, reason: "raw confidential text" } },
    ...["original", "corrected", "explanation"].map((key) => ({
      ...response,
      correction: { needed: false, [key]: "dog" },
    })),
    { ...response, correction: { needed: true } },
    {
      ...response,
      correction: { needed: true, corrected: "I like dogs", original: " I likes dogs " },
    },
    { ...response, reply: " " },
    { ...response, reply: "a".repeat(2001) },
    { ...response, newVocabulary: Array(31).fill("dog") },
  ])("rejects invalid shape without exposing values", (value) => {
    expect(() => validateAiResponse(value, "I likes dogs")).toThrow("PROVIDER_INVALID_RESPONSE");
  });
  it("accepts both discriminator alternatives and exact original", () => {
    expect(
      validateAiResponse({ ...response, correction: { needed: false } }, "dog").correction,
    ).toEqual({ needed: false });
    expect(
      validateAiResponse(
        {
          ...response,
          correction: { needed: true, original: "I likes dogs", corrected: "I like dogs" },
          safety: { flagged: true, reason: "other" },
        },
        "I likes dogs",
      ).safety.flagged,
    ).toBe(true);
  });
});
