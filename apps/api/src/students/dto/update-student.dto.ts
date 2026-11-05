import { PartialType, OmitType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { RecordStatus } from "@prisma/client";
import { CreateStudentDto } from "./create-student.dto";

export class UpdateStudentDto extends PartialType(
  OmitType(CreateStudentDto, ["email", "planName", "monthlyPrice"] as const),
) {
  @IsOptional() @IsEnum(RecordStatus) status?: RecordStatus;
}
