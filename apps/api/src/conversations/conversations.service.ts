import { Injectable } from "@nestjs/common";
import type { AgeBand, LearningLevel, MessageResponse, PracticeMode } from "@talkytown/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileOwnershipService } from "../child-profiles/profile-ownership.service";
import { PersistenceIds } from "../common/persistence-ids.service";
import { ApplicationClock } from "../common/application-clock";
import { sessionInclude, sessionResponse, turnResponse } from "../common/response-mappers";
import { fail } from "../common/api-error";
import { AiProvidersService, providerFingerprint } from "../ai-providers/ai-providers.service";
import { MissionEvaluationService } from "../missions/mission-evaluation.service";
import { MissionsService } from "../missions/missions.service";
import { SafetyService } from "../safety/safety.service";
import type { PreparedOperation } from "./prepared-operation";
import {
  ConversationStoreService,
  snapshotFingerprint,
  StaleConversation,
} from "./conversation-store.service";
import { StartSessionDto } from "./dto/start-session.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { ListTurnsQueryDto } from "./dto/list-turns-query.dto";
@Injectable()
export class ConversationsService {
  constructor(
    private readonly db: PrismaService,
    private readonly ownership: ProfileOwnershipService,
    private readonly ids: PersistenceIds,
    private readonly clock: ApplicationClock,
    private readonly providers: AiProvidersService,
    private readonly missions: MissionsService,
    private readonly evaluation: MissionEvaluationService,
    private readonly safety: SafetyService,
    private readonly store: ConversationStoreService,
  ) {}
  async start(userId: string, input: StartSessionDto) {
    if (input.mode === "free-talk" && input.missionCode !== undefined)
      fail(400, "MISSION_NOT_ALLOWED");
    const id = this.ids.session(userId, input.childProfileId, input.requestId);
    const { avatarName, ...result } = await this.db.$transaction(async (db) => {
      const profile = await this.ownership.lock(userId, input.childProfileId, db);
      const existing = await db.conversationSession.findUnique({
        where: { id },
        include: sessionInclude,
      });
      if (existing) {
        if (
          existing.mode !== input.mode ||
          (existing.mission?.code ?? undefined) !== input.missionCode
        )
          fail(409, "REQUEST_ID_CONFLICT");
        const opening = await db.conversationTurn.findUniqueOrThrow({
          where: { id: this.ids.opening(id) },
        });
        return {
          created: false,
          session: sessionResponse(existing),
          openingTurn: turnResponse(opening),
          avatarName: existing.avatar?.name,
        };
      }
      if (!profile.avatar?.isActive) fail(422, "AVATAR_UNAVAILABLE");
      const mission =
        input.mode === "guided-mission"
          ? await this.missions.eligible(input.missionCode!, profile.age, db)
          : null;
      const prompt = mission
        ? this.evaluation.prompt(mission.code, 0)
        : "Hi! What animal do you like?";
      await db.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR SHARE`;
      const selected = await this.providers.selected(userId, db);
      const at = this.clock.now();
      const session = await db.conversationSession.create({
        data: {
          id,
          childProfileId: profile.id,
          avatarId: profile.avatarId,
          missionId: mission?.id,
          mode: input.mode,
          aiProviderType: selected.providerType,
          aiModel: selected.model,
          startedAt: at,
        },
        include: sessionInclude,
      });
      // Deterministic opening, never provider generation inside a transaction.
      const opening = await db.conversationTurn.create({
        data: {
          id: this.ids.opening(id),
          sessionId: id,
          role: "avatar",
          content: prompt,
          createdAt: at,
        },
      });
      return {
        created: true,
        session: sessionResponse(session),
        openingTurn: turnResponse(opening),
        avatarName: profile.avatar.name,
      };
    });
    // Response review happens after commit, never in transaction/replay lookup.
    this.safety.assertReturnedTurnsSafe([result.openingTurn], avatarName);
    return result;
  }
  async get(userId: string, id: string) {
    return sessionResponse(await this.store.read(userId, id));
  }
  async turns(userId: string, id: string, query: ListTurnsQueryDto) {
    const session = await this.store.read(userId, id);
    if (query.cursor) {
      const cursor = await this.db.conversationTurn.findFirst({
        where: { id: query.cursor, sessionId: id },
      });
      if (!cursor) fail(400, "INVALID_CURSOR");
    }
    const turns = await this.db.conversationTurn.findMany({
      where: { sessionId: id },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: query.limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });
    const page = turns.slice(0, query.limit);
    const items = page.map(turnResponse);
    this.safety.assertReturnedTurnsSafe(items, session.avatar?.name);
    return {
      items,
      nextCursor: turns.length > query.limit ? page.at(-1)!.id : null,
    };
  }
  async message(userId: string, id: string, input: SendMessageDto) {
    const operationId = this.ids.operation(id, input.requestId);
    for (let attempt = 0; attempt < 3; attempt++) {
      const replay = await this.store.replay(userId, id, operationId);
      if (replay) return this.reviewMessageResponse(userId, id, replay);
      const session = await this.store.read(userId, id);
      this.store.assertActive(session);
      const decision = this.safety.screen(input.message, {
        source: "child-input",
        avatarName: session.avatar!.name,
      });
      const snapshot = snapshotFingerprint(session);
      let prepared: PreparedOperation;
      if (decision.flagged) {
        prepared = { kind: "blocked-input", snapshot, decision };
      } else {
        const selected = await this.providers.forSession(userId, session);
        const history = session.turns
          .filter((turn) => this.safety.isStoredTurnSafe(turn, session.avatar!.name))
          .slice(-20);
        // Mission history is previously accepted domain evidence. Do not reinterpret it
        // with today's moderation rules: Animal Adventure depends on its first animal.
        const projected = session.mission
          ? this.evaluation.evaluate(
              session.mission.code,
              session.missionProgress,
              input.message,
              session.turns
                .filter((turn) => turn.role === "child" && turn.xpAwarded > 0)
                .map((turn) => turn.content),
            ).progress
          : session.missionProgress;
        const output = await this.providers.generate(userId, selected, {
          ageBand: session.childProfile.ageBand as AgeBand,
          learningLevel: session.childProfile.level as LearningLevel,
          mode: session.mode as PracticeMode,
          message: input.message,
          avatar: { name: session.avatar!.name, personality: session.avatar!.personality },
          ...(session.mission
            ? this.evaluation.context(session.mission.code, session.missionProgress, projected)
            : {}),
          previousTurns: history.map((turn) => ({
            role: turn.role as "child" | "avatar" | "system",
            content: turn.content,
          })),
        });
        const outputDecision = this.safety.screenOutput(output, session.avatar!.name);
        const provider = providerFingerprint(selected);
        prepared = outputDecision.flagged
          ? {
              kind: "blocked-output",
              snapshot,
              provider,
              decision: {
                ...outputDecision,
                reason: "unsafe-provider-output",
                category: "provider-output",
                action: "redirect",
                template: "redirect",
              },
            }
          : {
              kind: "accepted",
              snapshot,
              provider,
              message: input.message,
              inputMode: input.inputMode,
              output,
            };
      }
      try {
        const result = await this.store.persist(userId, id, operationId, prepared);
        return await this.reviewMessageResponse(userId, id, result);
      } catch (error) {
        if (!(error instanceof StaleConversation)) throw error;
      }
    }
    return fail(409, "CONCURRENT_UPDATE");
  }
  end(userId: string, id: string) {
    return this.store.end(userId, id);
  }
  private async reviewMessageResponse(userId: string, id: string, result: MessageResponse) {
    const session = await this.store.read(userId, id);
    this.safety.assertReturnedTurnsSafe(
      result.childTurn ? [result.childTurn, result.avatarTurn] : [result.avatarTurn],
      session.avatar?.name,
    );
    return result;
  }
}
