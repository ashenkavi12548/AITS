import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClearanceDto {
  @ApiProperty({ description: 'Animal identification tag or UUID' })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({
    description: 'Purpose of transit/clearance',
    example: 'Commercial Sale',
  })
  @IsString()
  @IsNotEmpty()
  purpose: string;

  @ApiProperty({
    description: 'Destination facility or farm address',
    example: 'Colombo Municipal Abattoir',
  })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ description: 'Certificate valid until date in ISO format' })
  @IsDateString()
  validUntil: string;

  @ApiPropertyOptional({
    description: 'Transit conditions or biosecurity protocols',
  })
  @IsOptional()
  @IsString()
  conditions?: string;

  @ApiPropertyOptional({ description: 'Additional veterinary notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
