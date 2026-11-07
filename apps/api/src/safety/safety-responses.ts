import { reviewedSafetyResponses, safetyResponseLocale, type AgeBand } from "@talkytown/shared";
import type { SafetyTemplate } from "./safety-rules";
export function safetyResponse(template: SafetyTemplate, ageBand: AgeBand): string {
  return reviewedSafetyResponses[template][ageBand];
}
/** Exact reviewed responses only; support must not be reinterpreted as disclosure. */
export function isSafetyResponse(text: string): boolean {
  return safetyResponseLocale(text) !== undefined;
}
