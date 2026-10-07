import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  IsDateString,
  Matches,
} from 'class-validator';
import {
  DailyActivityType,
  ActivitySession,
  ActivityStatus,
} from '@prisma/client';

export class CreateDailyActivityDto {
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @IsString()
  @IsNotEmpty()
  farmId: string;

  @IsEnum(DailyActivityType)
  activityType: DailyActivityType;

  @IsDateString()
  activityDate: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'activityTime must be HH:mm' })
  activityTime: string;

  @IsEnum(ActivitySession)
  session: ActivitySession;

  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @IsString()
  @IsOptional()
  notes?: string;

  // Feeding
  @IsString()
  @IsOptional()
  feedType?: string;

  @IsString()
  @IsOptional()
  feedName?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  feedingMethod?: string;

  // Weight check
  @IsNumber()
  @IsOptional()
  weightKg?: number;

  // Health check
  @IsString()
  @IsOptional()
  observation?: string;

  @IsNumber()
  @IsOptional()
  temperature?: number;

  @IsString()
  @IsOptional()
  healthStatus?: string;

  @IsString()
  @IsOptional()
  symptoms?: string;

  @IsBoolean()
  @IsOptional()
  requiresVet?: boolean;
}
