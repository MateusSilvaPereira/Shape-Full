import {
  IsIn,
  IsNumberString,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from "class-validator";

export class CreateBannerDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsUrl() linkUrl?: string;
  @IsOptional() @IsNumberString() order?: string;
  @IsOptional() @IsIn(["true", "false"]) active?: string;
}
