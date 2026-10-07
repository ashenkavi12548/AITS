import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class TransferOwnershipDto {
  @IsUUID('4', { message: 'New owner ID must be a valid UUID' })
  @IsNotEmpty({ message: 'New owner user ID is required' })
  newOwnerId!: string;

  @IsOptional()
  @IsString({ message: 'Transfer reason must be a string' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  reason?: string;
}
