import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { MovementRestrictionType } from '@prisma/client';

export class CreateMovementRestrictionDto {
  @ApiProperty({
    description: 'Animal Tag to restrict',
    example: 'COW-LK-5097',
  })
  @IsString()
  @IsNotEmpty()
  animalTag: string;

  @ApiProperty({
    description: 'Reason for movement restriction',
    example: 'Active contagious disease isolation / biosecurity quarantine',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Scope of restriction',
    enum: MovementRestrictionType,
    default: MovementRestrictionType.ALL,
  })
  @IsEnum(MovementRestrictionType)
  @IsOptional()
  restrictionType?: MovementRestrictionType;

  @ApiPropertyOptional({
    description: 'Expected restriction end date (ISO-8601 string)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Notes on restriction',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class LiftMovementRestrictionDto {
  @ApiProperty({
    description: 'Reason for lifting the movement restriction',
    example:
      'Negative RT-PCR clearance and completion of mandatory 21-day quarantine',
  })
  @IsString()
  @IsNotEmpty()
  liftedReason: string;

  @ApiPropertyOptional({
    description: 'Additional notes or supporting certificate reference',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
