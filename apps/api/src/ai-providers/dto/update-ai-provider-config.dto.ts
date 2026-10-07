import { ApiProperty } from "@nestjs/swagger";
import { IsString, Length, Matches } from "class-validator";
import type { UpdateProviderConfigRequest } from "@talkytown/shared";
export class UpdateAiProviderConfigDto implements UpdateProviderConfigRequest {
  @ApiProperty({ example: "http://localhost:11434/v1", maxLength: 2048 })
  @IsString()
  @Length(1, 2048)
  baseUrl!: string;
  @ApiProperty({ example: "qwen2.5:3b", maxLength: 200 })
  @IsString()
  @Length(1, 200)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_.:/-]*$/)
  model!: string;
}
