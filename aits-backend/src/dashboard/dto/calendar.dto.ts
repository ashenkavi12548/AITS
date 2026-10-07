import { IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CalendarQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Filter: all | custom | system' })
  @IsOptional()
  @IsString()
  filter?: string;
}

export const CalendarEventType = {
  VACCINATION: 'VACCINATION',
  TREATMENT: 'TREATMENT',
  CALVING: 'CALVING',
  VET_VISIT: 'VET_VISIT',
  QUARANTINE: 'QUARANTINE',
  CUSTOM: 'CUSTOM',
} as const;

export type CalendarEventType =
  (typeof CalendarEventType)[keyof typeof CalendarEventType];

export class CalendarEventDto {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  type: CalendarEventType;
  color: string;
  animalId?: string;
  animalNumber?: string;
  farmId?: string;
  description?: string;
  source:
    | 'CUSTOM'
    | 'VACCINATION'
    | 'TREATMENT'
    | 'PREGNANCY'
    | 'VETERINARY_VISIT'
    | 'QUARANTINE'
    | 'OTHER';
  sourceId: string;
}
