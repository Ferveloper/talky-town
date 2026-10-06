import { describe, expect, it } from "vitest";

import { MockAiProvider } from "./index";

describe("MockAiProvider", () => {
  it("returns a deterministic guided mission response with a friendly correction", async () => {
    const provider = new MockAiProvider();

    const response = await provider.generateConversationReply({
      profileId: "demo-sofia",
      ageBand: "8-10",
      mode: "guided-mission",
      missionId: "animal-adventure",
      message: "I likes dogs",
    });

    expect(response.safety.flagged).toBe(false);
    expect(response.correction).toEqual({
      needed: true,
      original: "I likes dogs",
      corrected: "I like dogs",
      explanation: 'Use "like" with "I".',
    });
    expect(response.xp).toBe(10);
    expect(response.missionProgress).toBe(25);
    expect(response.avatarEmotion).toBe("thinking");
  });

  it("redirects personal-data topics without awarding XP", async () => {
    const provider = new MockAiProvider();

    const response = await provider.generateConversationReply({
      profileId: "demo-leo",
      ageBand: "5-7",
      mode: "free-talk",
      message: "What is your phone number?",
    });

    expect(response.safety).toEqual({
      flagged: true,
      reason: "personal-data-request",
    });
    expect(response.xp).toBe(0);
    expect(response.reply).toContain("fun and safe");
  });
});
