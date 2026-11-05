import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from "class-validator";

export class UpdateBannerDto {
  @IsOptional() @IsString() @MinLength(2) title?: string;
  @IsOptional() @IsUrl() linkUrl?: string;
  @IsOptional() @IsInt() order?: number;
  @IsOptional() @IsBoolean() active?: boolean;
}
