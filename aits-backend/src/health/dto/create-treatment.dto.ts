import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateTreatmentDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({ description: 'Medication or active substance' })
  @IsString()
  @IsNotEmpty()
  medication: string;

  @ApiPropertyOptional({ description: 'Medication ID from catalog' })
  @IsOptional()
  @IsString()
  medicationId?: string;

  @ApiPropertyOptional({ description: 'Related HealthRecord (Diagnosis) ID' })
  @IsOptional()
  @IsString()
  healthRecordId?: string;

  @ApiPropertyOptional({ description: 'Related HealthCase ID' })
  @IsOptional()
  @IsString()
  caseId?: string;

  @ApiPropertyOptional({
    description: 'Medication category (e.g. Antibiotic, NSAID, Supplement)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Dosage and route (e.g. 1 mL/10kg IM)' })
  @IsOptional()
  @IsString()
  dose?: string;

  @ApiPropertyOptional({ description: 'Treatment duration in days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiProperty({ description: 'Treatment start date in ISO format' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ description: 'Treatment end date in ISO format' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Milk withdrawal period in days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  withdrawalMilk?: number;

  @ApiPropertyOptional({ description: 'Meat withdrawal period in days' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  withdrawalMeat?: number;

  @ApiPropertyOptional({ description: 'Condition or clinical reason' })
  @IsOptional()
  @IsString()
  condition?: string;

  @ApiPropertyOptional({ description: 'Prescription notes and follow-up' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Rechecking date (Follow-up) in ISO format',
  })
  @IsOptional()
  @IsDateString()
  followUpDate?: string;
}
