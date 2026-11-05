import { IsEmail, IsHexColor, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateAcademyDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsHexColor() primaryColor?: string;
}
