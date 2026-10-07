import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { FarmUserRole, FarmUserStatus } from '@prisma/client';

export class EmployeeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit: number = 50;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  search?: string;

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
  @IsString()
  sortBy?: 'joinedAt' | 'name' | 'role' | 'status' = 'joinedAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
