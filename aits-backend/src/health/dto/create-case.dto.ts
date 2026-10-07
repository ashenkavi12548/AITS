import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { HealthCaseStatus } from '@prisma/client';

export class CreateHealthCaseDto {
  @ApiProperty({
    description: 'Animal Tag or Identification Number',
    example: 'COW-LK-5097',
  })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({
    description: 'Title of the Health Case',
    example: 'Acute Respiratory Distress & Suspected BRD',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Chief complaint observed by farmer or handler',
    example: 'Severe coughing, purulent nasal discharge, lethargy.',
  })
  @IsString()
  @IsOptional()
  chiefComplaint?: string;

  @ApiPropertyOptional({
    description: 'Initial Case Status',
    enum: HealthCaseStatus,
    default: HealthCaseStatus.OPEN,
  })
  @IsEnum(HealthCaseStatus)
  @IsOptional()
  status?: HealthCaseStatus;

  @ApiPropertyOptional({
    description: 'Assigned Veterinarian UUID (defaults to current user if vet)',
  })
  @IsUUID()
  @IsOptional()
  veterinarianId?: string;

  @ApiPropertyOptional({
    description: 'Clinical notes and initial instructions',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateHealthCaseDto {
  @ApiPropertyOptional({
    description: 'Case status transition',
    enum: HealthCaseStatus,
  })
  @IsEnum(HealthCaseStatus)
  @IsOptional()
  status?: HealthCaseStatus;

  @ApiPropertyOptional({
    description: 'Updated case title',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    description: 'Resolution notes when closing case',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
