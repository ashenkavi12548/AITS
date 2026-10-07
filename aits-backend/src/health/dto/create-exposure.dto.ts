import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { BiosecurityRiskLevel } from '@prisma/client';

export class CreateExposureRecordDto {
  @ApiProperty({
    description: 'Source (Index) Animal Tag',
    example: 'COW-LK-5097',
  })
  @IsString()
  @IsNotEmpty()
  sourceAnimalTag: string;

  @ApiProperty({
    description: 'Exposed / Contact Animal Tag',
    example: 'COW-LK-4820',
  })
  @IsString()
  @IsNotEmpty()
  contactAnimalTag: string;

  @ApiPropertyOptional({
    description: 'Exposure Date (ISO-8601 string, defaults to now)',
  })
  @IsDateString()
  @IsOptional()
  exposureDate?: string;

  @ApiProperty({
    description: 'Type of exposure event',
    example: 'Direct contact in shared pen / shared milking stall',
  })
  @IsString()
  @IsNotEmpty()
  exposureType: string;

  @ApiPropertyOptional({
    description: 'Location where exposure occurred',
    example: 'Milking Parlor B - Stalls 1-4',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiPropertyOptional({
    description: 'Assessed contact risk level',
    enum: BiosecurityRiskLevel,
    default: BiosecurityRiskLevel.HIGH,
  })
  @IsEnum(BiosecurityRiskLevel)
  @IsOptional()
  riskLevel?: BiosecurityRiskLevel;

  @ApiPropertyOptional({
    description: 'Recommended epidemiological action',
    example:
      'Clinical surveillance every 12h for 14 days, PCR testing before movement',
  })
  @IsString()
  @IsOptional()
  recommendedAction?: string;

  @ApiPropertyOptional({
    description: 'Action taken by farm staff or veterinarian',
    example:
      'Moved to secondary buffer pen; daily rectal temperature checks initiated',
  })
  @IsString()
  @IsOptional()
  actionTaken?: string;

  @ApiPropertyOptional({
    description: 'Notes on exposure history',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
