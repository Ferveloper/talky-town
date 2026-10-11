import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiCreatedResponse } from "@nestjs/swagger";
import { numericLevelSchema } from "../gamification/gamification-openapi";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ChildProfilesService } from "./child-profiles.service";
import { CreateChildProfileDto } from "./dto/create-child-profile.dto";
@ApiTags("child-profiles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("child-profiles")
export class ChildProfilesController {
  constructor(private readonly profiles: ChildProfilesService) {}
  @Get()
  @ApiOkResponse({
    description:
      "Owned profiles with ledger XP, current Madrid streak and numeric gamificationLevel",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: { type: "object", properties: { gamificationLevel: numericLevelSchema } },
        },
      },
    },
  })
  list(@CurrentUser() user: AdultIdentity) {
    return this.profiles.list(user.id);
  }
  @Get(":id")
  @ApiOkResponse({
    description: "ChildProfileResponse with derived gamificationLevel",
    schema: { type: "object", properties: { gamificationLevel: numericLevelSchema } },
  })
  get(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.profiles.get(user.id, id);
  }
  @Post()
  @ApiCreatedResponse({
    description:
      "ChildProfileResponse; learningLevel is proficiency, gamificationLevel starts at 1",
    schema: { type: "object", properties: { gamificationLevel: numericLevelSchema } },
  })
  create(@CurrentUser() user: AdultIdentity, @Body() body: CreateChildProfileDto) {
    return this.profiles.create(user.id, body);
  }
}
