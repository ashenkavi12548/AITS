import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LabResultStatus } from '@prisma/client';

export class CreateLabResultDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({
    description: 'Test type or diagnostic panel',
    example: 'PCR — Foot and Mouth Disease',
  })
  @IsString()
  @IsNotEmpty()
  testType: string;

  @ApiPropertyOptional({ description: 'Optional catalog ID' })
  @IsOptional()
  @IsString()
  catalogId?: string;

  @ApiPropertyOptional({ description: 'Optional case ID' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({
    description: 'URL to the lab report image or document',
  })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'List of document URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];

  @ApiProperty({
    description: 'Testing laboratory name',
    example: 'National Veterinary Research Institute',
  })
  @IsString()
  @IsNotEmpty()
  laboratory: string;

  @ApiProperty({ description: 'Sample collection date in ISO format' })
  @IsDateString()
  sampleDate: string;

  @ApiPropertyOptional({ description: 'Result reported date in ISO format' })
  @IsOptional()
  @IsDateString()
  resultDate?: string;

  @ApiPropertyOptional({
    description: 'Test outcome status',
    enum: LabResultStatus,
    default: LabResultStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(LabResultStatus)
  status?: LabResultStatus;

  @ApiPropertyOptional({
    description: 'Detailed result finding or titre value',
  })
  @IsOptional()
  @IsString()
  resultText?: string;

  @ApiPropertyOptional({
    description: 'Flagged for urgent veterinary attention',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @ApiPropertyOptional({ description: 'Clinical or lab technician notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateLabResultDto {
  @ApiPropertyOptional({ description: 'Result reported date in ISO format' })
  @IsOptional()
  @IsDateString()
  resultDate?: string;

  @ApiPropertyOptional({
    description: 'Test outcome status',
    enum: LabResultStatus,
  })
  @IsOptional()
  @IsEnum(LabResultStatus)
  status?: LabResultStatus;

  @ApiPropertyOptional({
    description: 'Detailed result finding or titre value',
  })
  @IsOptional()
  @IsString()
  resultText?: string;

  @ApiPropertyOptional({
    description: 'Flagged for urgent veterinary attention',
  })
  @IsOptional()
  @IsBoolean()
  isFlagged?: boolean;

  @ApiPropertyOptional({ description: 'Clinical or lab technician notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'URL to the lab report image or document',
  })
  @IsOptional()
  @IsString()
  documentUrl?: string;

  @ApiPropertyOptional({ description: 'List of document URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  documentUrls?: string[];
}
