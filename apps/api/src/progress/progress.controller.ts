import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProgressService } from "./progress.service";
@ApiTags("progress")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("child-profiles")
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}
  @Get(":id/progress") get(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.progress.get(user.id, id);
  }
}
