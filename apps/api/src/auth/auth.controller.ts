import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { CurrentUser } from "./current-user.decorator";
import { fail } from "../common/api-error";
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post("demo")
  @HttpCode(200)
  @ApiOperation({ summary: "Enter the seeded fictional demo account" })
  demo(@Body() body?: Record<string, unknown>) {
    if (body && Object.keys(body).length) fail(400, "VALIDATION_ERROR");
    return this.auth.demo();
  }
  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@CurrentUser() user: AdultIdentity) {
    return user;
  }
}
