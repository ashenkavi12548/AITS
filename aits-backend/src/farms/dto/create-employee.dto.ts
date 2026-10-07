import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FarmUserRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName!: string;

  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName!: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password!: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone?: string;

  @IsOptional()
  @IsEnum(FarmUserRole, {
    message:
      'Role must be one of: OWNER, MANAGER, VETERINARIAN, WORKER, AUDITOR',
  })
  role?: FarmUserRole;

  @IsOptional()
  @IsArray({ message: 'Permissions must be an array of permission keys' })
  @IsString({ each: true, message: 'Each permission key must be a string' })
  permissions?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  assignedStaff?: string[];

  @IsOptional()
  @IsUrl({}, { message: 'Profile image must be a valid URL' })
  profileImageUrl?: string;
}
