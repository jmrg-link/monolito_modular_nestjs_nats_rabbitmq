import { IsEmail, IsString, MinLength, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

/**
 * Data Transfer Object for user login credentials.
 * Validates input for authentication requests.
 */
export class LoginDto {
  @ApiProperty({
    description: "User's registered email address",
    example: "user@example.com",
    format: "email",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @ApiProperty({
    description: "Account password",
    example: "Password123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}

/**
 * Data Transfer Object for user registration.
 * Validates input for new account creation requests.
 */
export class RegisterDto {
  @ApiProperty({
    description: "Unique email address for the new account",
    example: "newuser@example.com",
    format: "email",
  })
  @IsEmail({}, { message: "Invalid email format" })
  @IsNotEmpty({ message: "Email is required" })
  email!: string;

  @ApiProperty({
    description: "User's full name",
    example: "John Smith",
    minLength: 2,
  })
  @IsString()
  @MinLength(2, { message: "Name must be at least 2 characters long" })
  @IsNotEmpty({ message: "Name is required" })
  name!: string;

  @ApiProperty({
    description: "Secure password for the account",
    example: "Password123",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  @IsNotEmpty({ message: "Password is required" })
  password!: string;
}

/**
 * Data Transfer Object for password change requests.
 * Validates current and new password inputs.
 */
export class ChangePasswordDto {
  @ApiProperty({
    description: "Current password for verification",
    example: "CurrentPassword123",
  })
  @IsString()
  @IsNotEmpty({ message: "Current password is required" })
  currentPassword!: string;

  @ApiProperty({
    description: "New password to set",
    example: "NewPassword456",
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: "New password must be at least 6 characters long" })
  @IsNotEmpty({ message: "New password is required" })
  newPassword!: string;
}

/**
 * Data Transfer Object for token refresh requests.
 * Validates refresh token input.
 */
export class RefreshTokenDto {
  @ApiProperty({
    description: "Refresh token obtained during authentication",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  @IsString()
  @IsNotEmpty({ message: "Refresh token is required" })
  refreshToken!: string;
}
