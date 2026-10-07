import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
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
  @Get() list(@CurrentUser() user: AdultIdentity) {
    return this.profiles.list(user.id);
  }
  @Get(":id") get(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.profiles.get(user.id, id);
  }
  @Post() create(@CurrentUser() user: AdultIdentity, @Body() body: CreateChildProfileDto) {
    return this.profiles.create(user.id, body);
  }
}
