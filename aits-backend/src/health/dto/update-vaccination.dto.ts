import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VaccinationStatus } from '@prisma/client';

export class UpdateVaccinationDto {
  @ApiPropertyOptional({ description: 'Vaccine name or program' })
  @IsOptional()
  @IsString()
  vaccineName?: string;

  @ApiPropertyOptional({ description: 'Dose administered (e.g. 2 mL IM)' })
  @IsOptional()
  @IsString()
  dose?: string;

  @ApiPropertyOptional({
    description: 'Next booster due date in ISO format',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  nextDueDate?: string | null;

  @ApiPropertyOptional({ description: 'Vaccine batch or lot number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({
    description: 'Administration status',
    enum: VaccinationStatus,
  })
  @IsOptional()
  @IsEnum(VaccinationStatus)
  status?: VaccinationStatus;

  @ApiPropertyOptional({ description: 'Clinical notes or adverse reactions' })
  @IsOptional()
  @IsString()
  notes?: string;
}
