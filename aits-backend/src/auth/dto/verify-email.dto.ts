import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsString({ message: 'Verification token must be a valid string' })
  @IsNotEmpty({ message: 'Verification token is required' })
  token!: string;
}

export class VerifyOtpDto {
  @IsEmail({}, { message: 'Please provide a valid registered email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Verification code must be a string' })
  @IsNotEmpty({ message: '6-digit verification code is required' })
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  otp!: string;
}

export class ResendVerificationDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}
