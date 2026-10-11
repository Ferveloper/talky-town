import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AgeBand, MessageResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { PersistenceIds } from "../common/persistence-ids.service";
import { ApplicationClock } from "../common/application-clock";
import { fail } from "../common/api-error";
import {
  sessionInclude,
  sessionResponse,
  turnResponse,
  endSessionResponse,
} from "../common/response-mappers";
import { AiProvidersService, providerFingerprint } from "../ai-providers/ai-providers.service";
import { GamificationService } from "../gamification/gamification.service";
import { acceptedPracticeEvents, practiceXp } from "../gamification/gamification-rules";
import { badgeEligibility } from "../gamification/badge-rules";
import { readBadgeEvidence } from "../gamification/badge-evidence";
import { practicedTerms } from "../gamification/vocabulary-rules";
import { MissionEvaluationService } from "../missions/mission-evaluation.service";
import { controlledSafetyReason } from "../safety/safety-rules";
import { safetyResponse } from "../safety/safety-responses";
import type { PreparedOperation } from "./prepared-operation";
const snapshotInclude = {
  ...sessionInclude,
  childProfile: true,
  turns: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
} satisfies Prisma.ConversationSessionInclude;
export type ConversationSnapshot = Prisma.ConversationSessionGetPayload<{
  include: typeof snapshotInclude;
}>;
export function snapshotFingerprint(session: ConversationSnapshot) {
  return JSON.stringify([
    session.status,
    session.missionProgress,
    session.turns.at(-1)?.id,
    session.childProfile.age,
    session.childProfile.level,
    session.childProfile.avatarId,
    session.avatar?.isActive,
    session.avatar?.updatedAt.toISOString(),
    session.aiProviderType,
    session.aiModel,
    session.mission?.updatedAt.toISOString(),
  ]);
}
export class StaleConversation extends Error {}
@Injectable()
export class ConversationStoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownership: ProfileOwnershipService,
    private readonly ids: PersistenceIds,
    private readonly clock: ApplicationClock,
    private readonly providers: AiProvidersService,
    private readonly gamification: GamificationService,
    private readonly missions: MissionEvaluationService,
  ) {}
  async read(
    userId: string,
    sessionId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<ConversationSnapshot> {
    const session = await db.conversationSession.findFirst({
      where: { id: sessionId, childProfile: { userId } },
      include: snapshotInclude,
    });
    if (!session) fail(404, "SESSION_NOT_FOUND");
    return session;
  }
  assertActive(session: ConversationSnapshot) {
    if (session.status !== "active") fail(409, "SESSION_NOT_ACTIVE");
    if (!session.avatar?.isActive || session.childProfile.avatarId !== session.avatarId)
      fail(422, "AVATAR_UNAVAILABLE");
    if (
      session.mode === "guided-mission" &&
      (!session.mission?.isActive ||
        session.childProfile.age < session.mission.minAge ||
        session.childProfile.age > session.mission.maxAge)
    )
      fail(422, "MISSION_INELIGIBLE");
  }
  async replay(
    userId: string,
    sessionId: string,
    operationId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<MessageResponse | null> {
    const session = await this.read(userId, sessionId, db);
    const avatar = await db.conversationTurn.findUnique({
      where: { id: this.ids.turn(operationId, "avatar") },
    });
    if (!avatar) return null;
    const child = await db.conversationTurn.findUnique({
      where: { id: this.ids.turn(operationId, "child") },
    });
    const safety = await db.safetyEvent.findUnique({ where: { id: this.ids.safety(operationId) } });
    const awards = await db.childBadge.findMany({
      where: { childProfileId: session.childProfileId, source: operationId },
      include: { badge: true },
      orderBy: { badgeId: "asc" },
    });
    const xp = await db.xpEvent.aggregate({
      where: { sessionId, source: operationId },
      _sum: { amount: true },
    });
    return {
      childTurn: child ? turnResponse(child) : null,
      avatarTurn: turnResponse(avatar),
      xpAwarded: xp._sum.amount ?? 0,
      practicedVocabulary: child ? practicedTerms(child.content) : [],
      awardedBadges: awards.map((award) => award.badge.code),
      safety: safety
        ? { flagged: true, reason: controlledSafetyReason(safety.reason) }
        : { flagged: false },
      session: sessionResponse(session),
    };
  }
  async persist(
    userId: string,
    sessionId: string,
    operationId: string,
    prepared: PreparedOperation,
  ) {
    return this.prisma.$transaction(
      async (db) => {
        const before = await this.read(userId, sessionId, db);
        await this.ownership.lock(userId, before.childProfileId, db);
        // Configuration changes lock the same adult. Active selection does not affect this session.
        await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR SHARE`;
        const replay = await this.replay(userId, sessionId, operationId, db);
        if (replay) return replay;
        const session = await this.read(userId, sessionId, db);
        this.assertActive(session);
        if (snapshotFingerprint(session) !== prepared.snapshot) throw new StaleConversation();
        if (prepared.kind !== "blocked-input") {
          const provider = await this.providers.forSession(userId, session, db);
          if (providerFingerprint(provider) !== prepared.provider) throw new StaleConversation();
        }
        const latest = await db.conversationTurn.findFirst({
          where: { session: { childProfileId: session.childProfileId } },
          orderBy: { createdAt: "desc" },
        });
        const at = new Date(
          Math.max(
            this.clock.now().getTime(),
            (session.turns.at(-1)?.createdAt.getTime() ?? 0) + 1,
            (latest?.createdAt.getTime() ?? 0) + 1,
          ),
        );
        if (prepared.kind !== "accepted") {
          await db.safetyEvent.create({
            data: {
              id: this.ids.safety(operationId),
              childProfileId: session.childProfileId,
              sessionId,
              category: prepared.decision.category,
              action: prepared.decision.action,
              reason: prepared.decision.reason,
              severity: prepared.decision.severity,
              createdAt: at,
            },
          });
        } else {
          const { evidence } = await readBadgeEvidence(db, session.childProfileId);
          const beforeEligibility = badgeEligibility(evidence, at);
          const evaluation = session.mission
            ? this.missions.evaluate(
                session.mission.code,
                session.missionProgress,
                prepared.message,
                // Keep accepted mission evidence consistent with projected evaluation.
                session.turns
                  .filter((turn) => turn.role === "child" && turn.xpAwarded > 0)
                  .map((turn) => turn.content),
              )
            : { progress: 0, completed: false };
          await db.conversationTurn.create({
            data: {
              id: this.ids.turn(operationId, "child"),
              sessionId,
              role: "child",
              content: prepared.message,
              inputMode: prepared.inputMode,
              xpAwarded: practiceXp(prepared.message),
              correctionNeeded: prepared.output.correction?.needed ?? false,
              correctedContent: prepared.output.correction?.needed
                ? prepared.output.correction.corrected
                : null,
              correctionExplanation: prepared.output.correction?.needed
                ? (prepared.output.correction.explanation ?? null)
                : null,
              createdAt: at,
            },
          });
          await db.conversationSession.update({
            where: { id: sessionId },
            data: {
              missionProgress: evaluation.progress,
              ...(evaluation.completed
                ? { status: "completed", endedAt: new Date(at.getTime() + 1) }
                : {}),
            },
          });
          await this.gamification.award(db, {
            childId: session.childProfileId,
            sessionId,
            operationId,
            message: prepared.message,
            corrected: prepared.output.correction?.needed ?? false,
            completed: evaluation.completed,
            completionReward: session.mission?.xpReward ?? 0,
            at,
            before: beforeEligibility,
          });
        }
        await db.conversationTurn.create({
          data: {
            id: this.ids.turn(operationId, "avatar"),
            sessionId,
            role: "avatar",
            content:
              prepared.kind === "accepted"
                ? prepared.output.reply
                : safetyResponse(
                    prepared.decision.template,
                    session.childProfile.ageBand as AgeBand,
                  ),
            inputMode: "text",
            xpAwarded: 0,
            createdAt: new Date(at.getTime() + 1),
          },
        });
        return (await this.replay(userId, sessionId, operationId, db))!;
      },
      { maxWait: 5000, timeout: 5000 },
    );
  }
  async end(userId: string, sessionId: string) {
    return this.prisma.$transaction(async (db) => {
      const before = await this.read(userId, sessionId, db);
      await this.ownership.lock(userId, before.childProfileId, db);
      const session = await this.read(userId, sessionId, db);
      if (session.status !== "active") return endSessionResponse(session);
      const events = await db.xpEvent.findMany({
        where: { childProfileId: session.childProfileId, sessionId },
      });
      const complete = session.mode === "free-talk" && acceptedPracticeEvents(events).length > 0;
      const endedAt = new Date(
        Math.max(this.clock.now().getTime(), session.turns.at(-1)?.createdAt.getTime() ?? 0),
      );
      if (complete)
        await this.gamification.completeFreeTalk(db, session.childProfileId, sessionId, endedAt);
      const updated = await db.conversationSession.update({
        where: { id: sessionId },
        data: { status: complete ? "completed" : "abandoned", endedAt },
        include: sessionInclude,
      });
      return endSessionResponse(updated);
    });
  }
}
