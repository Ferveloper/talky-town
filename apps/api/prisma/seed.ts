import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const demoUserEmail = process.env.DEMO_USER_EMAIL ?? "demo@talkytown.local";
const demoUserAlias = process.env.DEMO_USER_ALIAS ?? "Demo Tutor";
const mockProviderModel = process.env.AI_PROVIDER_MODEL ?? "talkytown-mock";

async function main() {
  const luna = await prisma.avatar.upsert({
    where: { code: "luna" },
    update: {
      name: "Luna",
      personality: "Patient, warm and encouraging",
      style: "Friendly star town guide",
      isActive: true,
    },
    create: {
      code: "luna",
      name: "Luna",
      personality: "Patient, warm and encouraging",
      style: "Friendly star town guide",
    },
  });

  const max = await prisma.avatar.upsert({
    where: { code: "max" },
    update: {
      name: "Max",
      personality: "Energetic, adventurous and playful",
      style: "TalkyTown explorer",
      isActive: true,
    },
    create: {
      code: "max",
      name: "Max",
      personality: "Energetic, adventurous and playful",
      style: "TalkyTown explorer",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {
      displayAlias: demoUserAlias,
    },
    create: {
      email: demoUserEmail,
      displayAlias: demoUserAlias,
    },
  });

  await prisma.aiProviderConfig.upsert({
    where: {
      userId_providerType: {
        userId: user.id,
        providerType: "mock",
      },
    },
    update: {
      isActive: true,
      baseUrl: null,
      model: mockProviderModel,
    },
    create: {
      userId: user.id,
      providerType: "mock",
      model: mockProviderModel,
      isActive: true,
    },
  });

  await prisma.childProfile.upsert({
    where: {
      userId_alias: {
        userId: user.id,
        alias: "Sofia",
      },
    },
    update: {
      age: 9,
      ageBand: "8-10",
      level: "explorer",
      avatarId: luna.id,
      xpTotal: 120,
      streakDays: 3,
    },
    create: {
      userId: user.id,
      alias: "Sofia",
      age: 9,
      ageBand: "8-10",
      nativeLanguage: "es",
      targetLanguage: "en",
      level: "explorer",
      avatarId: luna.id,
      xpTotal: 120,
      streakDays: 3,
    },
  });

  await prisma.childProfile.upsert({
    where: {
      userId_alias: {
        userId: user.id,
        alias: "Leo",
      },
    },
    update: {
      age: 6,
      ageBand: "5-7",
      level: "starter",
      avatarId: max.id,
      xpTotal: 35,
      streakDays: 1,
    },
    create: {
      userId: user.id,
      alias: "Leo",
      age: 6,
      ageBand: "5-7",
      nativeLanguage: "es",
      targetLanguage: "en",
      level: "starter",
      avatarId: max.id,
      xpTotal: 35,
      streakDays: 1,
    },
  });

  const missions = [
    {
      code: "meet-a-new-friend",
      title: "Meet a New Friend",
      description: "Practice greetings and short introductions.",
      ageBand: "5-7",
      xpReward: 25,
      sortOrder: 1,
    },
    {
      code: "animal-adventure",
      title: "Animal Adventure",
      description: "Talk about favorite animals using simple English sentences.",
      ageBand: "5-10",
      xpReward: 30,
      sortOrder: 2,
    },
    {
      code: "ice-cream-shop",
      title: "Ice Cream Shop",
      description: "Order a flavor and practice polite requests.",
      ageBand: "8-12",
      xpReward: 40,
      sortOrder: 3,
    },
    {
      code: "space-explorer",
      title: "Space Explorer",
      description: "Answer questions during a safe space adventure.",
      ageBand: "8-12",
      xpReward: 50,
      sortOrder: 4,
    },
  ];

  for (const mission of missions) {
    await prisma.mission.upsert({
      where: { code: mission.code },
      update: mission,
      create: mission,
    });
  }

  const badges = [
    {
      code: "first-talk",
      title: "First Talk",
      description: "Sent the first practice message.",
      icon: "message-circle",
      xpRequired: 5,
    },
    {
      code: "animal-explorer",
      title: "Animal Explorer",
      description: "Completed an animal mission.",
      icon: "paw-print",
      xpRequired: 30,
    },
    {
      code: "kind-corrector",
      title: "Kind Corrector",
      description: "Practiced a corrected sentence.",
      icon: "sparkles",
      xpRequired: 50,
    },
    {
      code: "three-day-streak",
      title: "3 Day Streak",
      description: "Practiced three days in a row.",
      icon: "flame",
      xpRequired: 75,
    },
    {
      code: "mission-hero",
      title: "Mission Hero",
      description: "Completed several guided missions.",
      icon: "badge-check",
      xpRequired: 120,
    },
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: badge,
      create: badge,
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
