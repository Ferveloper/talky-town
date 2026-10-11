import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOkResponse } from "@nestjs/swagger";
import { progressGamificationSchema } from "../gamification/gamification-openapi";
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
  @Get(":id/progress")
  @ApiOkResponse({
    description:
      "Read-only ledger-derived progress, with existing session, badge and vocabulary summaries",
    schema: progressGamificationSchema,
  })
  get(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.progress.get(user.id, id);
  }
}
