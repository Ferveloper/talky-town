import type { Prisma } from "@prisma/client";
import { PersistenceIds } from "../common/persistence-ids.service";
import { acceptedPracticeEvents } from "./gamification-rules";
import { genuineCorrection, type BadgeEvidence } from "./badge-rules";

/** Read only: ledger events establish practice; corrections require a linked persisted child turn. */
export async function readBadgeEvidence(db: Prisma.TransactionClient, childId: string) {
  const practice = await db.xpEvent.findMany({ where: { childProfileId: childId } });
  const sessions = await db.conversationSession.findMany({
    where: { childProfileId: childId },
    include: { mission: true, turns: true },
  });
  const turns = new Map(
    sessions.flatMap((session) => session.turns.map((turn) => [turn.id, turn] as const)),
  );
  const ids = new PersistenceIds();
  const corrections: Date[] = [];
  const unlinkedPracticeEventIds: string[] = [];
  for (const event of acceptedPracticeEvents(practice)) {
    const turnId =
      event.source === "demo" && event.id.startsWith(`demo-${childId}-`) && event.id.endsWith("-xp")
        ? event.id.slice(0, -3)
        : event.source
          ? ids.turn(event.source, "child")
          : null;
    const turn = turnId ? turns.get(turnId) : undefined;
    if (!turn || turn.sessionId !== event.sessionId || turn.role !== "child") {
      unlinkedPracticeEventIds.push(event.id);
      continue;
    }
    if (turn.correctionNeeded && genuineCorrection(turn.content, turn.correctedContent))
      corrections.push(event.createdAt);
  }
  const evidence: BadgeEvidence = {
    practice,
    corrections,
    guided: sessions
      .filter(
        (session) =>
          session.mode === "guided-mission" &&
          session.status === "completed" &&
          session.missionProgress === 100 &&
          session.mission &&
          session.endedAt,
      )
      .map((session) => ({
        id: session.id,
        missionCode: session.mission!.code,
        endedAt: session.endedAt!,
      })),
  };
  return { evidence, unlinkedPracticeEventIds };
}
