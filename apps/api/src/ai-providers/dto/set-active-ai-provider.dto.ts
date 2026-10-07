import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
import type { AiProviderType, SetActiveProviderRequest } from "@talkytown/shared";
export class SetActiveAiProviderDto implements SetActiveProviderRequest {
  @ApiProperty({ enum: ["mock", "openai-compatible-cloud", "local-openai-compatible"] })
  @IsIn(["mock", "openai-compatible-cloud", "local-openai-compatible"])
  providerType!: AiProviderType;
}
