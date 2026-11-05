import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from "class-validator";
import { TrainingItemDto } from "./training-item.dto";

export class CreateTrainingProgramDto {
  @IsString() @MinLength(2) title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() goal?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() studentId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TrainingItemDto)
  items: TrainingItemDto[];
}
