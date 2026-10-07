import { describe, expect, it } from "vitest";
import { MockAiProvider } from "./index";
describe("MockAiProvider", () => {
  it("returns deterministic gentle correction without rewards", async () => {
    const provider = new MockAiProvider();
    const input = {
      ageBand: "8-10" as const,
      learningLevel: "explorer" as const,
      mode: "guided-mission" as const,
      missionPrompt: "Name a different animal.",
      message: "I likes dogs",
    };
    const response = await provider.generateConversationReply(input);
    expect(response).toEqual(await provider.generateConversationReply(input));
    expect(response.correction).toEqual({
      needed: true,
      original: "I likes dogs",
      corrected: "I like dogs",
      explanation: 'Use "like" with "I".',
    });
    expect(response.reply).not.toContain(input.message);
    expect(response).not.toHaveProperty("xp");
    expect(response).not.toHaveProperty("missionProgress");
  });
  it("defensively redirects personal-data topics", async () => {
    const response = await new MockAiProvider().generateConversationReply({
      ageBand: "5-7",
      learningLevel: "starter",
      mode: "free-talk",
      message: "What is your phone number?",
    });
    expect(response.safety.flagged).toBe(true);
    expect(response.reply).not.toContain("phone");
  });
  it("adapts prompt to proficiency while preserving simple young-child correction", async () => {
    const provider = new MockAiProvider();
    const response = await provider.generateConversationReply({
      ageBand: "5-7",
      learningLevel: "hero",
      mode: "free-talk",
      message: "I likes dogs",
    });
    expect(response.correction?.explanation).toBe('Say "I like".');
    expect(response.reply).toContain("Why do you like");
    expect((await provider.checkStatus()).available).toBe(true);
  });
});
