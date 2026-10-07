import {
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
  IsNotEmpty,
  IsUUID,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FarmUserRole, FarmUserStatus } from '@prisma/client';

export class UpdateEmployeeDto {
  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @IsNotEmpty({ message: 'First name cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @IsNotEmpty({ message: 'Last name cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  phone?: string;

  @IsOptional()
  @IsEnum(FarmUserRole, {
    message: 'Role must be OWNER, MANAGER, VETERINARIAN, WORKER, or AUDITOR',
  })
  role?: FarmUserRole;

  @IsOptional()
  @IsEnum(FarmUserStatus, {
    message: 'Status must be ACTIVE, INACTIVE, or PENDING',
  })
  status?: FarmUserStatus;

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
