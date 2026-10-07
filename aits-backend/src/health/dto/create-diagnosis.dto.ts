import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HealthStatus } from '@prisma/client';

export class CreateDiagnosisDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({ description: 'Clinical condition or disease diagnosis' })
  @IsString()
  @IsNotEmpty()
  condition: string;

  @ApiPropertyOptional({
    description: 'Clinical severity level',
    enum: ['critical', 'high', 'moderate', 'low'],
    default: 'moderate',
  })
  @IsOptional()
  @IsString()
  severity?: string;

  @ApiPropertyOptional({
    description: 'Health status after diagnosis',
    enum: HealthStatus,
    default: HealthStatus.UNDER_TREATMENT,
  })
  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @ApiPropertyOptional({
    description: 'List of observed clinical symptoms',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  symptoms?: string[];

  @ApiPropertyOptional({ description: 'Clinical notes and treatment advice' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Date of examination in ISO format' })
  @IsOptional()
  @IsDateString()
  recordDate?: string;

  @ApiPropertyOptional({
    description: 'Recommend immediate biosecurity isolation',
  })
  @IsOptional()
  @IsBoolean()
  recommendIsolation?: boolean;

  @ApiPropertyOptional({ description: 'Optional linked Disease Catalog UUID' })
  @IsOptional()
  @IsString()
  diseaseId?: string;

  @ApiPropertyOptional({ description: 'Optional linked Health Case UUID' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({ description: 'Diagnostic certainty level' })
  @IsOptional()
  @IsString()
  certainty?: string;

  @ApiPropertyOptional({
    description: 'Require a lab result before prescription',
  })
  @IsOptional()
  @IsBoolean()
  labResultRequired?: boolean;
}
