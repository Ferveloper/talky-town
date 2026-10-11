import type { Prisma } from "@prisma/client";

export const badgeCatalog = [
  {
    code: "first-talk",
    title: "First Talk",
    description: "Send your first accepted practice message.",
    icon: "message-circle",
  },
  {
    code: "brave-speaker",
    title: "Brave Speaker",
    description: "Send ten accepted practice messages, across any sessions.",
    icon: "mic",
  },
  {
    code: "animal-explorer",
    title: "Animal Explorer",
    description: "Complete the Animal Adventure guided mission.",
    icon: "paw-print",
  },
  {
    code: "mission-complete",
    title: "Mission Complete",
    description: "Complete any guided mission.",
    icon: "flag",
  },
  {
    code: "three-day-streak",
    title: "3 Day Streak",
    description: "Practice on three consecutive calendar days in Europe/Madrid.",
    icon: "flame",
  },
  {
    code: "kind-corrector",
    title: "Kind Corrector",
    description: "Receive a genuine recorded correction during accepted practice.",
    icon: "sparkles",
  },
  {
    code: "mission-hero",
    title: "Mission Hero",
    description: "Complete three guided sessions; repeating a mission also counts.",
    icon: "badge-check",
  },
].map((badge) => ({ ...badge, xpRequired: null })) satisfies Prisma.BadgeCreateManyInput[];
export type BadgeCode = (typeof badgeCatalog)[number]["code"];

/** Definitions only: synchronization never changes profiles or existing awards. */
export async function synchronizeBadgeCatalog(db: Pick<Prisma.TransactionClient, "badge">) {
  const existing = await db.badge.findMany({
    where: { code: { in: badgeCatalog.map((badge) => badge.code) } },
  });
  const changed: string[] = [];
  for (const definition of badgeCatalog) {
    const row = existing.find((badge) => badge.code === definition.code);
    if (
      row &&
      row.title === definition.title &&
      row.description === definition.description &&
      row.icon === definition.icon &&
      row.xpRequired === null
    )
      continue;
    await db.badge.upsert({
      where: { code: definition.code },
      create: definition,
      update: definition,
    });
    changed.push(definition.code);
  }
  return changed;
}
