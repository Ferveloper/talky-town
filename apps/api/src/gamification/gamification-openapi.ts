export const numericLevelSchema = {
  type: "integer" as const,
  minimum: 1,
  description: "floor(ledger XP / 50) + 1; independent of learningLevel proficiency",
};
export const progressGamificationSchema = {
  type: "object" as const,
  properties: {
    gamificationLevel: numericLevelSchema,
    practiceTimezone: { type: "string" as const, enum: ["Europe/Madrid"] },
    levelProgress: {
      type: "object" as const,
      required: ["xpIntoLevel", "xpToNextLevel", "xpPerLevel"],
      properties: {
        xpIntoLevel: { type: "integer" as const, minimum: 0, maximum: 49 },
        xpToNextLevel: { type: "integer" as const, minimum: 1, maximum: 50 },
        xpPerLevel: { type: "integer" as const, enum: [50] },
      },
    },
    badgeCatalog: {
      type: "array" as const,
      items: {
        type: "object" as const,
        required: ["code", "title", "description", "icon", "unlocked", "awardedAt"],
        properties: {
          code: { type: "string" as const },
          title: { type: "string" as const },
          description: { type: "string" as const, description: "Explicit unlock criterion" },
          icon: { type: "string" as const },
          unlocked: { type: "boolean" as const },
          awardedAt: { type: "string" as const, format: "date-time", nullable: true },
        },
      },
    },
  },
};
