import { Transform } from "class-transformer";
import { IsIn, IsInt, IsString, Length, Matches, Max, Min } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import type { CreateChildProfileRequest, LearningLevel } from "@talkytown/shared";
export class CreateChildProfileDto implements CreateChildProfileRequest {
  @ApiProperty({ minLength: 2, maxLength: 24, example: "Star Explorer" })
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(2, 24)
  @Matches(/^[\p{L}\p{N} _-]+$/u)
  alias!: string;
  @ApiProperty({ minimum: 5, maximum: 12, example: 9 }) @IsInt() @Min(5) @Max(12) age!: number;
  @ApiProperty({ enum: ["es"] }) @IsIn(["es"]) nativeLanguage!: "es";
  @ApiProperty({ enum: ["en"] }) @IsIn(["en"]) targetLanguage!: "en";
  @ApiProperty({ enum: ["starter", "explorer", "hero"] })
  @IsIn(["starter", "explorer", "hero"])
  learningLevel!: LearningLevel;
  @ApiProperty({ example: "luna" }) @IsString() @Length(1, 80) avatarCode!: string;
}
