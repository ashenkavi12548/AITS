import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnimalGender, AnimalStatus, IdentifierType } from '@prisma/client';

export class CreateAnimalDto {
  @IsString({ message: 'Animal number / official ear tag must be a string' })
  @IsNotEmpty({ message: 'Animal number / official ear tag is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  animalNumber!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsString()
  species?: string = 'Cattle';

  @IsOptional()
  @IsString()
  breed?: string = 'Holstein-Friesian';

  @IsOptional()
  @IsEnum(AnimalGender, { message: 'Gender must be MALE or FEMALE' })
  gender?: AnimalGender = AnimalGender.FEMALE;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Weight must be a positive number' })
  weight?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  motherId?: string;

  @IsOptional()
  @IsString()
  fatherId?: string;

  @IsOptional()
  @IsString()
  motherTagOrId?: string;

  @IsOptional()
  @IsString()
  fatherTagOrId?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  rfidNumber?: string;

  @IsOptional()
  @IsString()
  registrationSource?: string = 'BORN_ON_FARM';

  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus = AnimalStatus.ACTIVE;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAnimalDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(AnimalGender)
  gender?: AnimalGender;

  @IsOptional()
  @IsString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateAnimalStatusDto {
  @IsEnum(AnimalStatus, {
    message:
      'Status must be ACTIVE, SOLD, TRANSFERRED, DECEASED, MISSING, or QUARANTINED',
  })
  @IsNotEmpty({ message: 'Status is required' })
  status!: AnimalStatus;

  @IsString({ message: 'Reason for status change is required' })
  @IsNotEmpty({ message: 'Reason for status change is required' })
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateIdentifierDto {
  @IsEnum(IdentifierType, {
    message: 'Identifier type must be QR, RFID, EAR_TAG, NATIONAL_ID, or OTHER',
  })
  @IsNotEmpty({ message: 'Identifier type is required' })
  identifierType!: IdentifierType;

  @IsString({ message: 'Identifier value is required' })
  @IsNotEmpty({ message: 'Identifier value is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  identifierValue!: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = false;
}

export class ReplaceQrDto {
  @IsString({ message: 'Replacement reason is required' })
  @IsNotEmpty({ message: 'Replacement reason is required' })
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class DeactivateQrDto {
  @IsString({ message: 'Deactivation reason is required' })
  @IsNotEmpty({ message: 'Deactivation reason is required' })
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AnimalQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  species?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsEnum(AnimalGender)
  gender?: AnimalGender;

  @IsOptional()
  @IsEnum(AnimalStatus)
  status?: AnimalStatus;

  @IsOptional()
  @IsEnum(AnimalStatus)
  excludeStatus?: AnimalStatus;

  @IsOptional()
  @IsEnum(IdentifierType)
  identifierType?: IdentifierType;

  @IsOptional()
  @IsString()
  sortBy?: 'animalNumber' | 'name' | 'dateOfBirth' | 'createdAt' | 'weight' =
    'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: 'Sort order must be asc or desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(
    ({ value }: { value: unknown }) => value === 'true' || value === true,
  )
  @IsBoolean()
  hasEligibleDiagnosis?: boolean;
}
