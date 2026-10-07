import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class CreateFeedingRecordDto {
  @IsUUID()
  @IsNotEmpty()
  animalId: string;

  @IsUUID()
  @IsNotEmpty()
  feedTypeId: string;

  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsDateString()
  @IsOptional()
  fedAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
