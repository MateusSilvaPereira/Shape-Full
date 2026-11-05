import { IsDateString, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CreateProgressDto {
  @IsString() studentId: string;
  @IsOptional() @IsNumber() @Min(0) weightKg?: number;
  @IsOptional() @IsNumber() @Min(0) bodyFatPct?: number;
  @IsOptional() @IsNumber() @Min(0) waistCm?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsDateString() measuredAt?: string;
}
