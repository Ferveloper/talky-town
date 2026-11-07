import type { AgeBand } from "./index";
export const SAFE_REDIRECTION =
  "Let's talk about something fun and safe. How about animals, space or games?";
export type ReviewedSafetyTemplate =
  | "redirect"
  | "relationship"
  | "self-harm"
  | "distress"
  | "bullying";
export const reviewedSafetyResponses: Record<ReviewedSafetyTemplate, Record<AgeBand, string>> = {
  redirect: {
    "5-7": "Let's talk about animals or games!",
    "8-10": SAFE_REDIRECTION,
    "11-12": "Let's choose a safe topic. We can practice English with animals, space or games.",
  },
  relationship: {
    "5-7": "I'm a pretend character. Let's play a safe word game!",
    "8-10":
      "I'm a pretend learning character. Real friends and trusted adults matter. Let's practice English safely.",
    "11-12":
      "I'm a virtual learning character. Keep real friends and trusted adults in your life. Let's choose a safe learning topic.",
  },
  "self-harm": {
    "5-7":
      "Siento que te sientas así. Busca ahora a un adulto de confianza. Pídele que se quede contigo. Si estás en peligro, pide ayuda urgente.",
    "8-10":
      "Siento que estés pasando por esto. No tienes que afrontarlo a solas. Busca ahora a un adulto de confianza y cuéntale cómo te sientes. Si estás en peligro inmediato, pide ayuda urgente a un adulto cercano.",
    "11-12":
      "Gracias por decirlo. No tienes que afrontar esto a solas. Habla ahora con un adulto de confianza que pueda acompañarte. Si estás en peligro inmediato, pide ayuda urgente a un adulto cercano.",
  },
  distress: {
    "5-7":
      "Siento que te sientas así. Busca a un adulto de confianza y cuéntaselo. Pídele que te acompañe.",
    "8-10":
      "Siento que estés pasando por esto. Habla con un adulto de confianza que pueda escucharte y acompañarte.",
    "11-12":
      "Gracias por contarlo. No tienes que afrontar esto a solas. Cuéntaselo a un adulto de confianza que pueda ayudarte.",
  },
  bullying: {
    "5-7": "Siento que te traten así. No es tu culpa. Cuéntaselo a un adulto de confianza.",
    "8-10":
      "Siento que te traten así. No es tu culpa. Habla con un adulto de confianza que pueda ayudarte a estar a salvo.",
    "11-12":
      "Siento que estés pasando por esto. No es tu culpa. Cuéntaselo a un adulto de confianza que pueda apoyarte y ayudarte a estar a salvo.",
  },
};
/** Exact catalogue lookup for presentation only; this is not moderation. */
export function safetyResponseLocale(text: string): "en" | "es" | undefined {
  for (const [template, bands] of Object.entries(reviewedSafetyResponses)) {
    if (Object.values(bands).includes(text))
      return ["self-harm", "distress", "bullying"].includes(template) ? "es" : "en";
  }
  return undefined;
}
