import { z } from "zod";
import { aiConversationResponseSchema, type AiConversationResponse } from "./ai-response.schema";
import { ProviderExecutionError } from "./provider-errors";

const envelopeSchema = z.object({
  choices: z
    .array(
      z.object({
        index: z.literal(0),
        finish_reason: z.literal("stop"),
        message: z.object({
          role: z.literal("assistant"),
          content: z.string().min(1).max(16384),
          tool_calls: z.never().optional(),
          function_call: z.never().optional(),
          refusal: z.null().optional(),
        }),
      }),
    )
    .length(1),
});

export function validateAiResponse(value: unknown, currentMessage: string): AiConversationResponse {
  const result = aiConversationResponseSchema.safeParse(value);
  if (
    !result.success ||
    (result.data.correction?.needed &&
      result.data.correction.original !== undefined &&
      result.data.correction.original !== currentMessage)
  ) {
    throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
  }
  return result.data;
}

export function parseAiResponse(envelope: unknown, currentMessage: string): AiConversationResponse {
  const result = envelopeSchema.safeParse(envelope);
  if (!result.success) throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
  const raw = result.data.choices[0]!.message.content.trim();
  const fence = /^```(?:json)?\s*\n([\s\S]*?)\n```$/i.exec(raw);
  let decoded: unknown;
  try {
    decoded = JSON.parse(fence ? fence[1]! : raw);
  } catch {
    throw new ProviderExecutionError("PROVIDER_INVALID_RESPONSE");
  }
  return validateAiResponse(decoded, currentMessage);
}
