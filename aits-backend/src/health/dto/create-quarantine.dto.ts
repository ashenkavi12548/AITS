import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateQuarantineDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiPropertyOptional({ description: 'Specific quarantine zone UUID' })
  @IsOptional()
  @IsString()
  zoneId?: string;

  @ApiProperty({
    description: 'Zone name or designated isolation pen',
    example: 'Zone A — Isolation Barn 1',
  })
  @IsString()
  @IsNotEmpty()
  zoneName: string;

  @ApiProperty({
    description: 'Reason for quarantine order',
    example: 'FMD Suspected — blisters on hooves, excessive salivation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiProperty({ description: 'Quarantine start date in ISO format' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Expected release date in ISO format' })
  @IsDateString()
  expectedRelease: string;

  @ApiPropertyOptional({
    description: 'Official government quarantine reference number',
  })
  @IsOptional()
  @IsString()
  govtRef?: string;

  @ApiPropertyOptional({
    description: 'Animal tags that had contact with this animal',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  contactAnimals?: string[];

  @ApiPropertyOptional({ description: 'Biosecurity instructions and notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
