import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VaccinationStatus } from '@prisma/client';

export class CreateVaccinationDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({ description: 'Vaccine name or program' })
  @IsString()
  @IsNotEmpty()
  vaccineName: string;

  @ApiProperty({ description: 'Dose administered (e.g. 2 mL IM)' })
  @IsString()
  @IsNotEmpty()
  dose: string;

  @ApiPropertyOptional({ description: 'Date of administration in ISO format' })
  @IsOptional()
  @IsDateString()
  vaccinationDate?: string;

  @ApiPropertyOptional({ description: 'Next booster due date in ISO format' })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional({ description: 'Vaccine batch or lot number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Administration status',
    enum: VaccinationStatus,
    default: VaccinationStatus.COMPLETED,
  })
  @IsOptional()
  @IsEnum(VaccinationStatus)
  status?: VaccinationStatus;

  @ApiPropertyOptional({ description: 'Clinical notes or adverse reactions' })
  @IsOptional()
  @IsString()
  notes?: string;
}
