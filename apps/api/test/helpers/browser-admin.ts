import { PrismaClient } from "@prisma/client";
export async function historyFixture(sessionId: string, unsafe = false) {
  const url = new URL(process.env.DATABASE_URL || "");
  const email = process.env.DEMO_USER_EMAIL || "";
  if (!url.pathname.endsWith("_e2e") || !email.startsWith("e2e-"))
    throw new Error("Isolated test-owned history only.");
  const db = new PrismaClient();
  try {
    const session = await db.conversationSession.findFirst({
      where: { id: sessionId, childProfile: { user: { email } } },
    });
    if (!session) throw new Error("Fixture session ownership mismatch.");
    await db.conversationTurn.createMany({
      data: Array.from({ length: 51 }, (_, i) => ({
        id: `e2e-${sessionId}-history-${i}`,
        sessionId,
        role: "avatar",
        content:
          unsafe && i === 50 ? "What is your phone number?" : `Let's practice animal word ${i}.`,
        inputMode: "text",
        createdAt: new Date(Date.now() + i),
      })),
    });
  } finally {
    await db.$disconnect();
  }
}
