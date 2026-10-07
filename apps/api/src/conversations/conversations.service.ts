import { Injectable } from "@nestjs/common";
import type { AgeBand, LearningLevel, PracticeMode } from "@talkytown/shared";
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
import { SAFE_REDIRECTION } from "../safety/safety-rules";
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
    return this.db.$transaction(async (db) => {
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
      await this.providers.selected(userId, db);
      const at = this.clock.now();
      const session = await db.conversationSession.create({
        data: {
          id,
          childProfileId: profile.id,
          avatarId: profile.avatarId,
          missionId: mission?.id,
          mode: input.mode,
          aiProviderType: "mock",
          aiModel: "talkytown-mock",
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
      };
    });
  }
  async get(userId: string, id: string) {
    return sessionResponse(await this.store.read(userId, id));
  }
  async turns(userId: string, id: string, query: ListTurnsQueryDto) {
    await this.store.read(userId, id);
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
    return {
      items: page.map(turnResponse),
      nextCursor: turns.length > query.limit ? page.at(-1)!.id : null,
    };
  }
  async message(userId: string, id: string, input: SendMessageDto) {
    const operationId = this.ids.operation(id, input.requestId);
    for (let attempt = 0; attempt < 3; attempt++) {
      const replay = await this.store.replay(userId, id, operationId);
      if (replay) return replay;
      const session = await this.store.read(userId, id);
      this.store.assertActive(session);
      const selected = await this.providers.selected(userId);
      const decision = this.safety.screen(input.message);
      const history = session.turns
        .filter((turn) => !this.safety.screen(turn.content).flagged)
        .slice(-20);
      const projected =
        !decision.flagged && session.mission
          ? this.evaluation.evaluate(
              session.mission.code,
              session.missionProgress,
              input.message,
              session.turns
                .filter((turn) => turn.role === "child" && turn.xpAwarded > 0)
                .map((turn) => turn.content),
            ).progress
          : session.missionProgress;
      const output = decision.flagged
        ? {
            reply: SAFE_REDIRECTION,
            newVocabulary: [],
            avatarEmotion: "encouraging" as const,
            safety: { flagged: true },
          }
        : await this.providers.generate({
            ageBand: session.childProfile.ageBand as AgeBand,
            learningLevel: session.childProfile.level as LearningLevel,
            mode: session.mode as PracticeMode,
            message: input.message,
            missionPrompt: session.mission
              ? this.evaluation.prompt(session.mission.code, projected)
              : undefined,
            previousTurns: history.map((turn) => ({
              role: turn.role as "child" | "avatar" | "system",
              content: turn.content,
            })),
          });
      const outputDecision = decision.flagged ? decision : this.safety.screenOutput(output);
      try {
        return await this.store.persist(userId, id, operationId, input, {
          snapshot: snapshotFingerprint(session),
          provider: providerFingerprint(selected),
          output,
          safety:
            outputDecision.flagged && !decision.flagged
              ? { ...outputDecision, reason: "unsafe-provider-output", category: "provider-output" }
              : outputDecision,
        });
      } catch (error) {
        if (!(error instanceof StaleConversation)) throw error;
      }
    }
    return fail(409, "CONCURRENT_UPDATE");
  }
  end(userId: string, id: string) {
    return this.store.end(userId, id);
  }
}
