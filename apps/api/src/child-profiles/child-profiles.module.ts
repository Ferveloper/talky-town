import { Module } from "@nestjs/common";
import { SafetyModule } from "../safety/safety.module";
import { ChildProfilesController } from "./child-profiles.controller";
import { ChildProfilesService } from "./child-profiles.service";
import { ProfileOwnershipService } from "./profile-ownership.service";
@Module({
  imports: [SafetyModule],
  controllers: [ChildProfilesController],
  providers: [ChildProfilesService, ProfileOwnershipService],
  exports: [ProfileOwnershipService],
})
export class ChildProfilesModule {}
