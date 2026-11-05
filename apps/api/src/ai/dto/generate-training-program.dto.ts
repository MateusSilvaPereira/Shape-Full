import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export const EXPERIENCE_LEVELS = ["INICIANTE", "INTERMEDIARIO", "AVANCADO"] as const;

export class GenerateTrainingProgramDto {
  @IsString() @MinLength(3) goal: string;
  @IsInt() @Min(1) @Max(7) daysPerWeek: number;
  @IsOptional() @IsIn(EXPERIENCE_LEVELS) experienceLevel?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() studentId?: string;
}
