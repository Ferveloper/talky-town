import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { CommonModule } from "./common/common.module";
import { AuthModule } from "./auth/auth.module";
import { ChildProfilesModule } from "./child-profiles/child-profiles.module";
import { AvatarsModule } from "./avatars/avatars.module";
import { MissionsModule } from "./missions/missions.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { AiProvidersModule } from "./ai-providers/ai-providers.module";
import { ProgressModule } from "./progress/progress.module";
import { validateApiConfig } from "./config/api-config";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env", "../../.env", "../../.env.example"],
      validate: validateApiConfig,
    }),
    PrismaModule,
    HealthModule,
    CommonModule,
    AuthModule,
    ChildProfilesModule,
    AvatarsModule,
    MissionsModule,
    AiProvidersModule,
    ConversationsModule,
    ProgressModule,
  ],
})
export class AppModule {}
