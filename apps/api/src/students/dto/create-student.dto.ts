import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { Gender } from "@prisma/client";

export class CreateStudentDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsEnum(Gender) gender?: Gender;
  @IsOptional() @IsNumber() heightCm?: number;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsString() planName?: string;
  @IsOptional() @IsNumber() monthlyPrice?: number;
}
