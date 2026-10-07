import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { FarmStatus } from '@prisma/client';

export class UpdateFarmDto {
  @IsOptional()
  @IsString({ message: 'Farm name must be a string' })
  @IsNotEmpty({ message: 'Farm name cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name?: string;

  @IsOptional()
  @IsString({ message: 'Farm type must be a string' })
  @IsNotEmpty({ message: 'Farm type cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  farmType?: string;

  @IsOptional()
  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  address?: string;

  @IsOptional()
  @IsString({ message: 'Province must be a string' })
  @IsNotEmpty({ message: 'Province cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  province?: string;

  @IsOptional()
  @IsString({ message: 'District must be a string' })
  @IsNotEmpty({ message: 'District cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  district?: string;

  @IsOptional()
  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  city?: string;

  @IsOptional()
  @IsString({ message: 'Contact number must be a string' })
  @IsNotEmpty({ message: 'Contact number cannot be empty' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactNumber?: string;

  @IsOptional()
  @IsEnum(FarmStatus, {
    message: 'Status must be ACTIVE, INACTIVE, SUSPENDED, or PENDING',
  })
  status?: FarmStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Latitude must be a valid number' })
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Longitude must be a valid number' })
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number;
}
