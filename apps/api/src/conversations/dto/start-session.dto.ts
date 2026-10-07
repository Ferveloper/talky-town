import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import type { PracticeMode, StartSessionRequest } from "@talkytown/shared";
export class StartSessionDto implements StartSessionRequest {
  @ApiProperty({ format: "uuid" }) @IsUUID() requestId!: string;
  @ApiProperty() @IsString() @Length(1, 200) childProfileId!: string;
  @ApiProperty({ enum: ["free-talk", "guided-mission"] })
  @IsIn(["free-talk", "guided-mission"])
  mode!: PracticeMode;
  @ApiPropertyOptional({ description: "Required for guided-mission; forbidden for free-talk" })
  @ValidateIf(
    (input: StartSessionDto) => input.mode === "guided-mission" || input.missionCode !== undefined,
  )
  @IsString()
  @Length(1, 80)
  missionCode?: string;
}
