import { Module } from "@nestjs/common";
import { ChildProfilesModule } from "../child-profiles/child-profiles.module";
import { ProgressController } from "./progress.controller";
import { ProgressService } from "./progress.service";
@Module({
  imports: [ChildProfilesModule],
  controllers: [ProgressController],
  providers: [ProgressService],
})
export class ProgressModule {}
