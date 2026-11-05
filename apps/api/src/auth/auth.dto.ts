import { IsEmail, IsString, MinLength } from "class-validator";
export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) password: string;
}
export class ForgotPasswordDto {
  @IsEmail() email: string;
}
export class ResetPasswordDto {
  @IsString() @MinLength(10) token: string;
  @IsString() @MinLength(8) newPassword: string;
}
