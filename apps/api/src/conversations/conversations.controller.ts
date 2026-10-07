import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { fail } from "../common/api-error";
import { ConversationsService } from "./conversations.service";
import { StartSessionDto } from "./dto/start-session.dto";
import { SendMessageDto } from "./dto/send-message.dto";
import { ListTurnsQueryDto } from "./dto/list-turns-query.dto";
@ApiTags("conversations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("conversations/sessions")
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}
  @Post() async start(
    @CurrentUser() user: AdultIdentity,
    @Body() input: StartSessionDto,
    @Res({ passthrough: true }) response: { status(code: number): void },
  ) {
    const { created, ...result } = await this.conversations.start(user.id, input);
    response.status(created ? 201 : 200);
    return result;
  }
  @Get(":id") get(@CurrentUser() user: AdultIdentity, @Param("id") id: string) {
    return this.conversations.get(user.id, id);
  }
  @Get(":id/turns") turns(
    @CurrentUser() user: AdultIdentity,
    @Param("id") id: string,
    @Query() query: ListTurnsQueryDto,
  ) {
    return this.conversations.turns(user.id, id, query);
  }
  @Post(":id/messages") @HttpCode(200) message(
    @CurrentUser() user: AdultIdentity,
    @Param("id") id: string,
    @Body() input: SendMessageDto,
  ) {
    return this.conversations.message(user.id, id, input);
  }
  @Post(":id/end") @HttpCode(200) end(
    @CurrentUser() user: AdultIdentity,
    @Param("id") id: string,
    @Body() body?: Record<string, unknown>,
  ) {
    if (body && Object.keys(body).length) fail(400, "VALIDATION_ERROR");
    return this.conversations.end(user.id, id);
  }
}
