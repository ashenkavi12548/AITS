import { PartialType } from '@nestjs/swagger';
import { CreateTreatmentDto } from './create-treatment.dto';
import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTreatmentDto extends PartialType(CreateTreatmentDto) {
  @ApiPropertyOptional({ description: 'Reason for voiding the record' })
  @IsOptional()
  @IsString()
  voidReason?: string;
}
