import { OmitType, PartialType } from "@nestjs/swagger";
import { CreateMembershipDto } from "./create-membership.dto";

export class UpdateMembershipDto extends PartialType(
  OmitType(CreateMembershipDto, ["studentId"] as const),
) {}
