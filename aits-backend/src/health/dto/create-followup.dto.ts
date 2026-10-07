import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { FollowUpStatus } from '@prisma/client';

export class CreateFollowUpDto {
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
    description: 'Scheduled Date for Veterinary Follow-Up (ISO-8601 string)',
    example: '2026-09-12T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiProperty({
    description: 'Clinical reason for follow-up evaluation',
    example:
      'Re-evaluate vesicular healing and post-treatment milk withholding compliance.',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    description: 'Assigned Veterinarian UUID (defaults to current user)',
  })
  @IsUUID()
  @IsOptional()
  assignedVetId?: string;

  @ApiPropertyOptional({
    description: 'Additional clinical instructions',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteFollowUpDto {
  @ApiPropertyOptional({
    description: 'Follow-up status transition',
    enum: FollowUpStatus,
    default: FollowUpStatus.COMPLETED,
  })
  @IsEnum(FollowUpStatus)
  @IsOptional()
  status?: FollowUpStatus;

  @ApiProperty({
    description: 'Clinical outcome and findings',
    example:
      'Complete lesion epithelialization. Normal appetite and milk yield restored.',
  })
  @IsString()
  @IsNotEmpty()
  outcome: string;

  @ApiPropertyOptional({
    description: 'Additional follow-up notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
