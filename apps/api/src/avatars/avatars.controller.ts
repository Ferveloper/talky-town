import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AvatarsService } from "./avatars.service";
@ApiTags("avatars")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("avatars")
export class AvatarsController {
  constructor(private readonly avatars: AvatarsService) {}
  @Get() list() {
    return this.avatars.list();
  }
}
