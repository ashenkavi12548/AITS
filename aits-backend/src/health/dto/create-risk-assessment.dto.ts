import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { BiosecurityRiskLevel } from '@prisma/client';

export class CreateRiskAssessmentDto {
  @ApiProperty({
    description: 'Animal Tag or Identification Number',
    example: 'COW-LK-5097',
  })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiPropertyOptional({
    description: 'Associated Health Case UUID',
  })
  @IsUUID()
  @IsOptional()
  caseId?: string;

  @ApiProperty({
    description: 'Assessed Biosecurity Risk Level',
    enum: BiosecurityRiskLevel,
    example: BiosecurityRiskLevel.HIGH,
  })
  @IsEnum(BiosecurityRiskLevel)
  @IsNotEmpty()
  riskLevel: BiosecurityRiskLevel;

  @ApiPropertyOptional({
    description: 'Contagiousness rating (1-5 scale)',
    example: 4,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  contagiousnessScore?: number;

  @ApiPropertyOptional({
    description: 'Clinical severity summary',
    example: 'High fever, acute vesicular lesions with mucosal shedding',
  })
  @IsString()
  @IsOptional()
  clinicalSeverity?: string;

  @ApiPropertyOptional({
    description: 'Herd exposure rating (1-5 scale)',
    example: 3,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  exposureScore?: number;

  @ApiProperty({
    description: 'Recommended containment action',
    example:
      'Immediate isolation in Zone A Barn 1. Restrict visitor and vehicle access.',
  })
  @IsString()
  @IsNotEmpty()
  containmentRecommendation: string;

  @ApiPropertyOptional({
    description: 'Additional biosecurity considerations',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
