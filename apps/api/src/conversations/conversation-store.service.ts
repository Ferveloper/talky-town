import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { AiConversationResponse } from "@talkytown/ai-core";
import type { MessageResponse } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { PersistenceIds } from "../common/persistence-ids.service";
import { ApplicationClock } from "../common/application-clock";
import { fail } from "../common/api-error";
import { sessionInclude, sessionResponse, turnResponse } from "../common/response-mappers";
import { AiProvidersService, providerFingerprint } from "../ai-providers/ai-providers.service";
import { GamificationService } from "../gamification/gamification.service";
import { practicedTerms } from "../gamification/vocabulary-rules";
import { MissionEvaluationService } from "../missions/mission-evaluation.service";
import { SAFE_REDIRECTION, type SafetyDecision } from "../safety/safety-rules";
import type { SendMessageDto } from "./dto/send-message.dto";
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
      safety: safety ? { flagged: true, reason: safety.reason } : { flagged: false },
      session: sessionResponse(session),
    };
  }
  async persist(
    userId: string,
    sessionId: string,
    operationId: string,
    input: SendMessageDto,
    prepared: {
      snapshot: string;
      provider: string;
      output: AiConversationResponse;
      safety: SafetyDecision;
    },
  ) {
    return this.prisma.$transaction(
      async (db) => {
        const before = await this.read(userId, sessionId, db);
        await this.ownership.lock(userId, before.childProfileId, db);
        // Activation locks the same adult row exclusively, preventing selection changes during commit.
        await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR SHARE`;
        const replay = await this.replay(userId, sessionId, operationId, db);
        if (replay) return replay;
        const session = await this.read(userId, sessionId, db);
        this.assertActive(session);
        const provider = await this.providers.selected(userId, db);
        if (
          snapshotFingerprint(session) !== prepared.snapshot ||
          providerFingerprint(provider) !== prepared.provider
        )
          throw new StaleConversation();
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
        if (prepared.safety.flagged) {
          await db.safetyEvent.create({
            data: {
              id: this.ids.safety(operationId),
              childProfileId: session.childProfileId,
              sessionId,
              category: prepared.safety.category ?? "provider-output",
              action: "redirect",
              reason: prepared.safety.reason ?? "provider-safety-flag",
              severity: "warning",
              createdAt: at,
            },
          });
        } else {
          const evaluation = session.mission
            ? this.missions.evaluate(
                session.mission.code,
                session.missionProgress,
                input.message,
                session.turns
                  .filter((turn) => turn.role === "child" && turn.xpAwarded > 0)
                  .map((turn) => turn.content),
              )
            : { progress: 0, completed: false };
          const reward = await this.gamification.award(db, {
            childId: session.childProfileId,
            sessionId,
            operationId,
            message: input.message,
            corrected: prepared.output.correction?.needed ?? false,
            completed: evaluation.completed,
            missionCode: session.mission?.code,
            completionReward: session.mission?.xpReward ?? 0,
            at,
          });
          await db.conversationTurn.create({
            data: {
              id: this.ids.turn(operationId, "child"),
              sessionId,
              role: "child",
              content: input.message,
              inputMode: input.inputMode,
              xpAwarded: reward.practiceXp,
              correctionNeeded: prepared.output.correction?.needed ?? false,
              correctedContent: prepared.output.correction?.corrected ?? null,
              correctionExplanation: prepared.output.correction?.explanation ?? null,
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
        }
        await db.conversationTurn.create({
          data: {
            id: this.ids.turn(operationId, "avatar"),
            sessionId,
            role: "avatar",
            content: prepared.safety.flagged ? SAFE_REDIRECTION : prepared.output.reply,
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
      if (session.status !== "active") return sessionResponse(session);
      const complete =
        session.mode === "free-talk" &&
        session.turns.some((turn) => turn.role === "child" && turn.xpAwarded > 0);
      const endedAt = new Date(
        Math.max(this.clock.now().getTime(), session.turns.at(-1)?.createdAt.getTime() ?? 0),
      );
      const updated = await db.conversationSession.update({
        where: { id: sessionId },
        data: { status: complete ? "completed" : "abandoned", endedAt },
        include: sessionInclude,
      });
      return sessionResponse(updated);
    });
  }
}
