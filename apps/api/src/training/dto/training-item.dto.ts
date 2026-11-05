import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class TrainingItemDto {
  @IsOptional() @IsString() exerciseId?: string;
  @IsString() @MinLength(1) exerciseName: string;
  @IsInt() @Min(1) sets: number;
  @IsString() @MinLength(1) reps: string;
  @IsOptional() @IsInt() @Min(0) restSeconds?: number;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsInt() order?: number;
}
