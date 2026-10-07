import { describe, expect, it } from "vitest";
import type { CreateChildProfileRequest, SendMessageRequest } from "./index";
describe("Phase 4 transport contracts", () => {
  it("uses learningLevel and already transcribed voice text", () => {
    const profile: CreateChildProfileRequest = {
      alias: "Star Explorer",
      age: 9,
      nativeLanguage: "es",
      targetLanguage: "en",
      learningLevel: "hero",
      avatarCode: "luna",
    };
    const message: SendMessageRequest = {
      requestId: "request",
      message: "dog",
      inputMode: "voice",
    };
    expect(profile.learningLevel).toBe("hero");
    expect(profile).not.toHaveProperty("level");
    expect(message).not.toHaveProperty("audio");
  });
});
