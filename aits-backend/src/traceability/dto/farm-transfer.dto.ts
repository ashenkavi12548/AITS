import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  IsDateString,
} from 'class-validator';
import { FarmTransferReason } from '@prisma/client';

export class CreateFarmTransferDto {
  @IsString()
  @IsNotEmpty()
  animalId: string;

  @IsString()
  @IsNotEmpty()
  fromFarmId: string;

  @IsString()
  @IsNotEmpty()
  toFarmId: string;

  @IsDateString()
  departureDate: string; // YYYY-MM-DD

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'departureTime must be HH:mm' })
  departureTime: string;

  @IsDateString()
  expectedArrivalDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'expectedArrivalTime must be HH:mm' })
  expectedArrivalTime: string;

  @IsEnum(FarmTransferReason)
  reason: FarmTransferReason;

  @IsString()
  @IsOptional()
  healthClearanceId?: string;

  @IsString()
  @IsOptional()
  vehicleNumber?: string;

  @IsString()
  @IsOptional()
  driverName?: string;

  @IsString()
  @IsOptional()
  driverContact?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfirmArrivalDto {
  @IsDateString()
  actualArrivalDate: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'actualArrivalTime must be HH:mm' })
  actualArrivalTime: string;
}

export class CancelTransferDto {
  @IsString()
  @IsOptional()
  cancelReason?: string;
}
