import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { RoleName } from '@prisma/client';

export class RegisterDto {
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  phone?: string;

  @IsOptional()
  @IsIn(['FARMER', 'MANAGER', 'VETERINARIAN', 'WORKER'], {
    message: 'Role must be one of: FARMER, MANAGER, VETERINARIAN, WORKER',
  })
  role?: RoleName;

  // Optional Farm Creation Fields (especially for FARMER role)
  @IsOptional()
  @IsString()
  farmName?: string;

  @IsOptional()
  @IsString()
  farmType?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  district?: string;

  @IsOptional()
  @IsString()
  city?: string;
}
