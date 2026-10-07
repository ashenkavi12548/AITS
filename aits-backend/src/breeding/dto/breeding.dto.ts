import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  Min,
  Max,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum BreedingMethodInput {
  ARTIFICIAL_INSEMINATION = 'ARTIFICIAL_INSEMINATION',
  NATURAL = 'NATURAL',
}

export enum BreedingStatusInput {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  PREGNANCY_CHECK_PENDING = 'PREGNANCY_CHECK_PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  UNSUCCESSFUL = 'UNSUCCESSFUL',
  CANCELLED = 'CANCELLED',
}

export enum PregnancyCheckTypeInput {
  SIXTY_DAY_CHECK = '60_DAY_CHECK',
  NINETY_DAY_CHECK = '90_DAY_CHECK',
  ADDITIONAL_CHECK = 'ADDITIONAL_CHECK',
}

export enum PregnancyStatusInput {
  NOT_CHECKED = 'NOT_CHECKED',
  CONFIRMED = 'CONFIRMED',
  NOT_PREGNANT = 'NOT_PREGNANT',
  RECHECK_REQUIRED = 'RECHECK_REQUIRED',
  PREGNANCY_LOST = 'PREGNANCY_LOST',
}

export enum CalvingStatusInput {
  EXPECTED = 'EXPECTED',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
  COMPLICATED = 'COMPLICATED',
  ABORTED = 'ABORTED',
  STILLBIRTH = 'STILLBIRTH',
}

// ============================================================================
// 1. BREEDING SERVICE DTOs
// ============================================================================

export class CreateBreedingDto {
  @ApiProperty({ description: 'Female animal UUID or tag' })
  @IsString()
  @IsNotEmpty()
  femaleAnimalId!: string;

  @ApiProperty({ description: 'Target Farm UUID' })
  @IsString()
  @IsNotEmpty()
  farmId!: string;

  @ApiProperty({ description: 'Service Date in YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  serviceDate!: string;

  @ApiProperty({
    enum: BreedingMethodInput,
    default: BreedingMethodInput.ARTIFICIAL_INSEMINATION,
  })
  @IsEnum(BreedingMethodInput)
  serviceMethod!: BreedingMethodInput;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  attemptNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technician?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  // AI specific fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenStrawId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenBatchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullBreed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenSupplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inseminationMethod?: string;

  // Natural Breeding fields
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullTag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullOwnerSource?: string;

  // Computed Dates
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstPregnancyCheckDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondPregnancyCheckDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedCalvingDate?: string;
}

export class UpdateBreedingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  femaleAnimalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  serviceDate?: string;

  @ApiPropertyOptional({ enum: BreedingMethodInput })
  @IsOptional()
  @IsEnum(BreedingMethodInput)
  serviceMethod?: BreedingMethodInput;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  attemptNumber?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technician?: string;

  @ApiPropertyOptional({ enum: BreedingStatusInput })
  @IsOptional()
  @IsEnum(BreedingStatusInput)
  status?: BreedingStatusInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenStrawId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenBatchNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullBreed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  semenSupplier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  inseminationMethod?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullTag?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bullOwnerSource?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firstPregnancyCheckDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  secondPregnancyCheckDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedCalvingDate?: string;
}

export class BreedingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiPropertyOptional({ enum: BreedingMethodInput })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({ enum: BreedingStatusInput })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technician?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    enum: [
      'serviceDate',
      'femaleAnimalTag',
      'farmName',
      'attemptNumber',
      'status',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// ============================================================================
// 2. PREGNANCY CHECK DTOs
// ============================================================================

export class CreatePregnancyCheckDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  breedingServiceId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  femaleAnimalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmId!: string;

  @ApiProperty({ description: 'YYYY-MM-DD' })
  @IsString()
  @IsNotEmpty()
  checkDate!: string;

  @ApiProperty({ enum: PregnancyCheckTypeInput })
  @IsEnum(PregnancyCheckTypeInput)
  checkType!: PregnancyCheckTypeInput;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  checkMethod?: string;

  @ApiProperty({ enum: PregnancyStatusInput })
  @IsEnum(PregnancyStatusInput)
  pregnancyStatus!: PregnancyStatusInput;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pregnancyStageDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  technicianOrVet?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  estimatedCalvingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PregnancyQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiPropertyOptional({ enum: PregnancyCheckTypeInput })
  @IsOptional()
  @IsString()
  checkType?: string;

  @ApiPropertyOptional({ enum: PregnancyStatusInput })
  @IsOptional()
  @IsString()
  pregnancyStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDateTo?: string;

  @ApiPropertyOptional({
    enum: [
      'checkDueDate',
      'femaleAnimalTag',
      'farmName',
      'pregnancyStatus',
      'checkDate',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

// ============================================================================
// 3. CALVING RECORD DTOs
// ============================================================================

export class CreateCalvingDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pregnancyCheckId?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  motherAnimalId!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  farmId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedCalvingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualCalvingDate?: string;

  @ApiProperty({ enum: CalvingStatusInput })
  @IsEnum(CalvingStatusInput)
  calvingStatus!: CalvingStatusInput;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  numberOfCalves?: number = 1;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'TWINS_MIXED'] })
  @IsOptional()
  @IsString()
  calfGender?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  calfBirthWeightKg?: number;

  @ApiPropertyOptional({ enum: ['HEALTHY', 'WEAK', 'STILLBORN'] })
  @IsOptional()
  @IsString()
  calfStatus?: string;

  @ApiPropertyOptional({ enum: ['EASY', 'MODERATE', 'SEVERE_DYSTOCIA'] })
  @IsOptional()
  @IsString()
  birthDifficulty?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  assistanceRequired?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  complications?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  recordedBy?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CalvingQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  farmId?: string;

  @ApiPropertyOptional({ enum: CalvingStatusInput })
  @IsOptional()
  @IsString()
  calvingStatus?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedDateFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expectedDateTo?: string;

  @ApiPropertyOptional({
    enum: [
      'expectedCalvingDate',
      'actualCalvingDate',
      'motherAnimalTag',
      'calvingStatus',
    ],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
