import { describe, expect, it } from "vitest";
import { parseAiResponse } from "./ai-response.parser";
const value = {
  reply: "Great!",
  newVocabulary: ["dog"],
  avatarEmotion: "happy",
  safety: { flagged: false },
};
const envelope = (content: unknown, finish_reason = "stop") => ({
  choices: [{ index: 0, finish_reason, message: { role: "assistant", content } }],
});
describe("Chat Completions parser", () => {
  it("parses JSON and a single outer JSON fence", () => {
    expect(parseAiResponse(envelope(JSON.stringify(value)), "dog")).toEqual(value);
    expect(parseAiResponse(envelope("```json\n" + JSON.stringify(value) + "\n```"), "dog")).toEqual(
      value,
    );
  });
  it.each([
    {},
    envelope(null),
    envelope(""),
    envelope("{}", "length"),
    envelope("{invalid}"),
    envelope("Here is " + JSON.stringify(value)),
    {
      choices: [
        {
          index: 0,
          finish_reason: "stop",
          message: { role: "assistant", content: JSON.stringify(value), tool_calls: [] },
        },
      ],
    },
  ])("rejects unusable envelope/content", (input) => {
    expect(() => parseAiResponse(input, "dog")).toThrow("PROVIDER_INVALID_RESPONSE");
  });
});
