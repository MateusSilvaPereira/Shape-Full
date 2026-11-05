import { IsInt, IsOptional, IsPositive, IsString, Min, MinLength } from "class-validator";

export class GenerateMealPlanDto {
  @IsString() @MinLength(3) goal: string;
  @IsOptional() @IsInt() @IsPositive() dailyCalories?: number;
  @IsOptional() @IsInt() @Min(2) mealsPerDay?: number;
  @IsOptional() @IsString() restrictions?: string;
  @IsOptional() @IsString() studentId?: string;
}
