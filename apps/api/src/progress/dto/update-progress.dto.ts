import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateProgressDto } from "./create-progress.dto";

export class UpdateProgressDto extends PartialType(
  OmitType(CreateProgressDto, ["studentId"] as const),
) {}
