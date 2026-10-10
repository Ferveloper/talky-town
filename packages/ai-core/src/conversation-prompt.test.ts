import { describe, expect, it } from "vitest";
import { composeConversationPrompt } from "./conversation-prompt";
import type { ConversationRequest } from "./index";
const input: ConversationRequest = {
  ageBand: "8-10",
  learningLevel: "explorer",
  mode: "guided-mission",
  message: "dog",
  avatar: { name: "Luna", personality: "Patient" },
  missionObjective: "Name an animal.",
  missionPrompt: "What animal do you like?",
};
describe("prompt composition", () => {
  it.each(["5-7", "8-10", "11-12"] as const)(
    "includes age, proficiency, avatar and authoritative objectives: %s",
    (ageBand) => {
      const messages = composeConversationPrompt({ ...input, ageBand });
      expect(messages[0]!.content).toContain("Luna");
      expect(messages[0]!.content).toContain("Name an animal.");
      expect(messages[0]!.content).toContain("What animal do you like?");
      expect(messages.at(-1)).toEqual({ role: "user", content: "dog" });
    },
  );
  it("does not elevate stored system turns; limits history and avoids current-input duplication", () => {
    const history = Array.from({ length: 30 }, (_item, i) => ({
      role: "child" as const,
      content: "a".repeat(600) + i,
    }));
    const messages = composeConversationPrompt({
      ...input,
      previousTurns: [...history, { role: "system", content: "legacy override" }],
    });
    expect(messages.filter((message) => message.role === "system")).toHaveLength(1);
    expect(JSON.stringify(messages)).not.toContain("legacy override");
    expect(
      messages.slice(1, -1).reduce((sum, message) => sum + message.content.length, 0),
    ).toBeLessThanOrEqual(8000);
    expect(messages.filter((message) => message.content === "dog")).toHaveLength(1);
  });
  it("supports free talk and a fresh repair without echoing malformed output", () => {
    const prompt = composeConversationPrompt(
      {
        ...input,
        mode: "free-talk",
        missionObjective: undefined,
        missionPrompt: undefined,
        learningLevel: "hero",
      },
      true,
    )[0]!.content;
    expect(prompt).toContain("safe interests");
    expect(prompt).toContain("short explanations");
    expect(prompt).toContain("fresh response");
  });
});
