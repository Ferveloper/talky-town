import { PrismaClient } from "@prisma/client";
import { seedDemo } from "../../prisma/seed-demo";
import { historyFixture } from "./browser-admin";
const url = new URL(process.env.DATABASE_URL || "");
const email = process.env.DEMO_USER_EMAIL || "";
if (!url.pathname.endsWith("_e2e") || !email.startsWith("e2e-"))
  throw new Error("Browser fixtures require a test database and test-owned adult.");
const prisma = new PrismaClient();
async function main() {
  if (process.argv[2] === "history") {
    await historyFixture(process.argv[3] || "", process.argv[4] === "unsafe");
    return;
  }
  if (process.argv[2] === "create") {
    await seedDemo(prisma);
    return;
  }
  if (process.argv[2] !== "cleanup") throw new Error("Unknown fixture operation");
  const adult = await prisma.user.findUnique({ where: { email } });
  if (!adult) return;
  const children = await prisma.childProfile.findMany({
    where: { userId: adult.id },
    select: { id: true },
  });
  const ids = children.map((child) => child.id);
  const sessions = await prisma.conversationSession.findMany({
    where: { childProfileId: { in: ids } },
    select: { id: true },
  });
  await prisma.$transaction(async (db) => {
    await db.safetyEvent.deleteMany({
      where: {
        OR: [{ childProfileId: { in: ids } }, { sessionId: { in: sessions.map((s) => s.id) } }],
      },
    });
    await db.aiProviderConfig.deleteMany({ where: { userId: adult.id } });
    await db.user.delete({ where: { id: adult.id } });
  });
}
main()
  .catch(() => {
    console.error("Browser fixture operation failed.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
