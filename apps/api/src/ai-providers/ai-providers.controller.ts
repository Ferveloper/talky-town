import { Body, Controller, Get, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AiProvidersService } from "./ai-providers.service";
import { SetActiveAiProviderDto } from "./dto/set-active-ai-provider.dto";
@ApiTags("ai-providers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("ai-providers")
export class AiProvidersController {
  constructor(private readonly providers: AiProvidersService) {}
  @Get() list(@CurrentUser() user: AdultIdentity) {
    return this.providers.list(user.id);
  }
  @Put("active") activate(
    @CurrentUser() user: AdultIdentity,
    @Body() input: SetActiveAiProviderDto,
  ) {
    return this.providers.activate(user.id, input.providerType);
  }
}
