import { z } from "zod";

const text = (maximum: number) => z.string().trim().min(1).max(maximum);
export const correctionSchema = z.discriminatedUnion("needed", [
  z.strictObject({ needed: z.literal(false) }),
  z.strictObject({
    needed: z.literal(true),
    original: z.string().min(1).max(500).optional(),
    corrected: text(500),
    explanation: text(500).optional(),
  }),
]);
export const providerSafetySchema = z.discriminatedUnion("flagged", [
  z.strictObject({ flagged: z.literal(false) }),
  z.strictObject({
    flagged: z.literal(true),
    reason: z.enum(["personal-data-request", "unsuitable-topic", "instruction-override", "other"]),
  }),
]);
export const aiConversationResponseSchema = z.strictObject({
  reply: text(2000),
  correction: correctionSchema.optional(),
  newVocabulary: z.array(text(80)).max(30),
  avatarEmotion: z.enum(["happy", "thinking", "celebrating", "encouraging"]),
  safety: providerSafetySchema,
});
export type AiConversationResponse = z.infer<typeof aiConversationResponseSchema>;
