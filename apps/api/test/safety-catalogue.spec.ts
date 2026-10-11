import { describe, expect, it } from "vitest";
import { safetyResponseLocale, type AgeBand } from "@talkytown/shared";
import { isSafetyResponse, safetyResponse } from "../src/safety/safety-responses";
import { type SafetyTemplate, screenText } from "../src/safety/safety-rules";
import { phase6GoldenResponses } from "./phase6-safety-golden";
describe("behavior-preserving Phase 6 presentation catalogue", () => {
  for (const template of Object.keys(phase6GoldenResponses) as SafetyTemplate[]) {
    for (const age of ["5-7", "8-10", "11-12"] as AgeBand[]) {
      it(`preserves every UTF-8 byte of ${template}/${age}`, () => {
        const original = phase6GoldenResponses[template][age];
        expect(Buffer.from(safetyResponse(template, age))).toEqual(Buffer.from(original));
        expect(isSafetyResponse(original)).toBe(true);
        expect(safetyResponseLocale(original)).toBe(
          ["self-harm", "distress", "bullying"].includes(template) ? "es" : "en",
        );
        expect(isSafetyResponse(original + " ")).toBe(false);
      });
    }
  }
  it.each([
    ["I want to hurt myself", "self-harm-risk", "critical", "self-harm"],
    ["Nobody cares about me", "serious-distress", "warning", "distress"],
    ["I am being bullied", "bullying-disclosure", "warning", "bullying"],
  ])(
    "preserves category, severity and template selection for %s",
    (text, reason, severity, template) => {
      expect(screenText(text, { source: "child-input", avatarName: "Luna" })).toMatchObject({
        flagged: true,
        category: "wellbeing",
        reason,
        severity,
        action: "support",
        template,
      });
    },
  );
});
