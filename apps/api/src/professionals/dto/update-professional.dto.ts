import { OmitType, PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { RecordStatus } from "@prisma/client";
import { CreateProfessionalDto } from "./create-professional.dto";

export class UpdateProfessionalDto extends PartialType(
  OmitType(CreateProfessionalDto, ["email"] as const),
) {
  @IsOptional() @IsEnum(RecordStatus) status?: RecordStatus;
}
