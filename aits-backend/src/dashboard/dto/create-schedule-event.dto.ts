import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  Matches,
} from 'class-validator';

export enum ScheduleEventType {
  VACCINATION = 'VACCINATION',
  TREATMENT = 'TREATMENT',
  CALVING = 'CALVING',
  VET_VISIT = 'VET_VISIT',
  CUSTOM = 'CUSTOM',
}

export class CreateScheduleEventDto {
  @ApiProperty({
    description: 'Animal Ear Tag Number or UUID',
    example: 'COW-LK-5097',
  })
  @IsString()
  @IsOptional()
  animalTag?: string;

  @ApiProperty({
    description: 'Type of veterinary event to schedule',
    enum: ScheduleEventType,
    example: ScheduleEventType.VACCINATION,
  })
  @IsEnum(ScheduleEventType)
  @IsNotEmpty()
  eventType: ScheduleEventType;

  @ApiProperty({
    description: 'Title or purpose of the event',
    example: 'Foot & Mouth Disease Annual Booster',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Scheduled date and time (ISO-8601 string)',
    example: '2026-09-15T09:00:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate: string;

  @ApiPropertyOptional({
    description: 'Optional name of the vaccine for vaccination events',
    example: 'FMD Bivalent Oil Adjuvant Vaccine',
  })
  @IsString()
  @IsOptional()
  vaccineName?: string;

  @ApiPropertyOptional({
    description: 'Optional medication name for treatment events',
    example: 'Oxytetracycline 20% LA',
  })
  @IsString()
  @IsOptional()
  medication?: string;

  @ApiPropertyOptional({
    description: 'Dose specification',
    example: '2 mL Subcutaneous',
  })
  @IsString()
  @IsOptional()
  dose?: string;

  @ApiPropertyOptional({
    description: 'Clinical instructions or administration notes',
  })
  @IsString()
  @IsOptional()
  instructions?: string;

  @ApiPropertyOptional({ description: 'Additional notes or reminders' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether to dispatch an email alert to the user',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({
    description: 'Whether to create an in-app system notification',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  createNotification?: boolean;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'All-day event flag' })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    description: 'Event color as hex (#RRGGBB)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'color must be a valid hex color (e.g. #3B82F6)',
  })
  color?: string;

  @ApiPropertyOptional({ description: 'Farm ID if no animal is selected' })
  @IsString()
  @IsOptional()
  farmId?: string;
}

export class UpdateCalendarEventDto {
  @ApiPropertyOptional({ description: 'Event title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Event notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Date (ISO-8601)' })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({ description: 'Start time (HH:MM)' })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM)' })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'All-day event flag' })
  @IsBoolean()
  @IsOptional()
  isAllDay?: boolean;

  @ApiPropertyOptional({
    description: 'Event color as hex (#RRGGBB)',
    example: '#3B82F6',
  })
  @IsOptional()
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/, {
    message: 'color must be a valid hex color (e.g. #3B82F6)',
  })
  color?: string;

  @ApiPropertyOptional({ description: 'Related animal tag or UUID' })
  @IsString()
  @IsOptional()
  animalTag?: string;
}
