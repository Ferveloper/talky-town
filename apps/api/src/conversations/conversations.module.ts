import { Module } from "@nestjs/common";
import { ChildProfilesModule } from "../child-profiles/child-profiles.module";
import { AiProvidersModule } from "../ai-providers/ai-providers.module";
import { MissionsModule } from "../missions/missions.module";
import { SafetyModule } from "../safety/safety.module";
import { GamificationModule } from "../gamification/gamification.module";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { ConversationStoreService } from "./conversation-store.service";
@Module({
  imports: [
    ChildProfilesModule,
    AiProvidersModule,
    MissionsModule,
    SafetyModule,
    GamificationModule,
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationStoreService],
})
export class ConversationsModule {}
