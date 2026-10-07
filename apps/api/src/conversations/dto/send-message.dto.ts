import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsIn, IsString, IsUUID, Length, ValidateIf } from "class-validator";
import type { InputMode, SendMessageRequest } from "@talkytown/shared";
export class SendMessageDto implements SendMessageRequest {
  @ApiProperty({ format: "uuid" }) @IsUUID() requestId!: string;
  @ApiProperty({ minLength: 1, maxLength: 500, example: "I like dogs" })
  @Transform(({ value }: { value: unknown }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @Length(1, 500)
  message!: string;
  @ApiPropertyOptional({
    enum: ["text", "voice"],
    default: "text",
    description: "voice is already transcribed text; no audio upload",
  })
  @ValidateIf((_input, value: unknown) => value !== undefined)
  @IsIn(["text", "voice"])
  inputMode: InputMode = "text";
}
