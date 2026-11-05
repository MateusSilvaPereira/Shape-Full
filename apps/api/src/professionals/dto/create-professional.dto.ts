import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "@prisma/client";

export const ASSIGNABLE_STAFF_ROLES = [
  Role.ACADEMY_ADMIN,
  Role.TRAINER,
  Role.NUTRITIONIST,
  Role.RECEPTIONIST,
];

export class CreateProfessionalDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() phone?: string;
  @IsIn(ASSIGNABLE_STAFF_ROLES) role: Role;
}
