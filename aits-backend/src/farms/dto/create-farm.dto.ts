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

export class CreateFarmDto {
  @IsString({ message: 'Farm name must be a string' })
  @IsNotEmpty({ message: 'Farm name is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  name!: string;

  @IsString({ message: 'Farm type must be a string' })
  @IsNotEmpty({ message: 'Farm type is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  farmType!: string;

  @IsString({ message: 'Address must be a string' })
  @IsNotEmpty({ message: 'Address is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  address!: string;

  @IsString({ message: 'Province must be a string' })
  @IsNotEmpty({ message: 'Province is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  province!: string;

  @IsString({ message: 'District must be a string' })
  @IsNotEmpty({ message: 'District is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  district!: string;

  @IsString({ message: 'City must be a string' })
  @IsNotEmpty({ message: 'City is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  city!: string;

  @IsString({ message: 'Contact number must be a string' })
  @IsNotEmpty({ message: 'Contact number is required' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  contactNumber!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  registrationNumber?: string;

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

  @IsOptional()
  @IsEnum(FarmStatus, {
    message: 'Status must be ACTIVE, INACTIVE, SUSPENDED, or PENDING',
  })
  status?: FarmStatus;
}
