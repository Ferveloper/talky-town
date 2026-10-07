import { Body, Controller, Get, Put, Post, Param, HttpCode, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { AdultIdentity } from "@talkytown/shared";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AiProvidersService } from "./ai-providers.service";
import { SetActiveAiProviderDto } from "./dto/set-active-ai-provider.dto";
import { UpdateAiProviderConfigDto } from "./dto/update-ai-provider-config.dto";
import { providerTypes } from "./ai-provider-registry.service";
import { fail } from "../common/api-error";
function routeType(raw: string) {
  const type = providerTypes.find((type) => type === raw);
  if (!type) fail(400, "VALIDATION_ERROR");
  return type;
}
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
  @Put(":providerType/config") configure(
    @CurrentUser() user: AdultIdentity,
    @Param("providerType") type: string,
    @Body() input: UpdateAiProviderConfigDto,
  ) {
    return this.providers.configure(user.id, routeType(type), input);
  }
  @Post(":providerType/test") @HttpCode(200) test(
    @CurrentUser() user: AdultIdentity,
    @Param("providerType") type: string,
    @Body() body?: Record<string, unknown>,
  ) {
    if (body && Object.keys(body).length) fail(400, "VALIDATION_ERROR");
    return this.providers.test(user.id, routeType(type));
  }
}
