import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class MealDto {
  @IsString() @MinLength(1) name: string;
  @IsOptional() @IsString() time?: string;
  @IsString() @MinLength(1) description: string;
  @IsOptional() @IsInt() @Min(0) calories?: number;
  @IsOptional() @IsInt() order?: number;
}
