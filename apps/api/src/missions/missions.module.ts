import { Module } from "@nestjs/common";
import { ChildProfilesModule } from "../child-profiles/child-profiles.module";
import { MissionsController } from "./missions.controller";
import { MissionsService } from "./missions.service";
import { MissionEvaluationService } from "./mission-evaluation.service";
@Module({
  imports: [ChildProfilesModule],
  controllers: [MissionsController],
  providers: [MissionsService, MissionEvaluationService],
  exports: [MissionsService, MissionEvaluationService],
})
export class MissionsModule {}
