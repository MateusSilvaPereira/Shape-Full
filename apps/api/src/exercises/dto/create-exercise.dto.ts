import { IsOptional, IsString, IsUrl, MinLength } from "class-validator";

export class CreateExerciseDto {
  @IsString() @MinLength(2) name: string;
  @IsString() @MinLength(2) muscleGroup: string;
  @IsOptional() @IsString() instructions?: string;
  @IsOptional() @IsUrl() videoUrl?: string;
}
