import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from "class-validator";

export const MEMBERSHIP_STATUSES = [
  "ACTIVE",
  "PENDING",
  "OVERDUE",
  "CANCELLED",
] as const;

export class CreateMembershipDto {
  @IsString() studentId: string;
  @IsString() @MinLength(2) planName: string;
  @IsNumber() @Min(0) monthlyPrice: number;
  @IsOptional() @IsIn(MEMBERSHIP_STATUSES) status?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
