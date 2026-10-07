import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MissionsService } from "./missions.service";
@ApiTags("missions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("child-profiles")
export class MissionsController {
  constructor(private readonly missions: MissionsService) {}
  @Get(":id/missions") list(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.missions.list(user.id, id);
  }
}
