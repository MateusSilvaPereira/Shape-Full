import { IsArray, IsIn, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export class ChatMessageDto {
  @IsIn(["user", "model"]) role: "user" | "model";
  @IsString() @MinLength(1) text: string;
}

export class AiChatDto {
  @IsString() @MinLength(1) message: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}
