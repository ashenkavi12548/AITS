import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MilkingSession } from '@prisma/client';

export class CreateMilkProductionDto {
  @IsString({ message: 'Animal ID or Tag must be a string' })
  @IsNotEmpty({ message: 'Animal ID or Tag is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  animalId!: string;

  @IsString({ message: 'Farm ID must be a valid identifier' })
  @IsNotEmpty({ message: 'Farm ID is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  farmId!: string;

  @IsString({ message: 'Production date is required' })
  @IsNotEmpty({ message: 'Production date is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  productionDate!: string;

  @IsEnum(MilkingSession, {
    message: 'Milking session must be MORNING, AFTERNOON, or EVENING',
  })
  milkingSession!: MilkingSession;

  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a valid number of liters' })
  @Min(0.01, { message: 'Quantity must be greater than zero liters' })
  @Max(100.0, {
    message: 'Quantity cannot exceed 100 liters per milking session',
  })
  quantityLiters!: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  milkQuality?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Fat percentage cannot be negative' })
  @Max(15, { message: 'Fat percentage cannot exceed 15%' })
  fatPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Protein percentage cannot be negative' })
  @Max(10, { message: 'Protein percentage cannot exceed 10%' })
  proteinPercentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

export class UpdateMilkProductionDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  animalId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  farmId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  productionDate?: string;

  @IsOptional()
  @IsEnum(MilkingSession, {
    message: 'Milking session must be MORNING, AFTERNOON, or EVENING',
  })
  milkingSession?: MilkingSession;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a valid number of liters' })
  @Min(0.01, { message: 'Quantity must be greater than zero liters' })
  @Max(100.0, {
    message: 'Quantity cannot exceed 100 liters per milking session',
  })
  quantityLiters?: number;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  milkQuality?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(15)
  fatPercentage?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(10)
  proteinPercentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  notes?: string;
}

export class MilkProductionQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  animalId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  session?: string;

  @IsOptional()
  @IsString()
  qualityStatus?: string;

  @IsOptional()
  @IsString()
  sortBy?:
    'date' | 'quantityLiters' | 'animalTag' | 'farmName' | 'qualityStatus';

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class VoidMilkProductionDto {
  @IsString({ message: 'Void reason must be a valid text string' })
  @IsNotEmpty({
    message:
      'A reason for voiding this production record is mandatory for audit and traceability compliance.',
  })
  @MinLength(5, {
    message: 'Void reason must be at least 5 characters long.',
  })
  @MaxLength(500, {
    message: 'Void reason cannot exceed 500 characters.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason!: string;
}
