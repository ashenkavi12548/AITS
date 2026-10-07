import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Matches,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString({ message: 'Email or phone number must be a valid string' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Identifier must be a valid string' })
  @Matches(/^(?:[^\s@]+@[^\s@]+\.[^\s@]+|[\d\s\-()+]+)$/, {
    message: 'Please enter a valid email address or mobile number',
  })
  identifier?: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;
}
