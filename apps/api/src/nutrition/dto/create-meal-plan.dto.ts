import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MealPlanStatus } from "@prisma/client";
import { MealDto } from "./meal.dto";

export class CreateMealPlanDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsEnum(MealPlanStatus) status?: MealPlanStatus;
  @IsOptional() @IsNumber() @Min(0) dailyWaterLiters?: number;
  @IsOptional() @IsString() studentId?: string;
  @IsOptional() @IsString() nutritionistId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => MealDto)
  meals: MealDto[];
}
