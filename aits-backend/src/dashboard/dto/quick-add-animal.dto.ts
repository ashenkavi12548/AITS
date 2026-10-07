import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { AnimalGender } from '@prisma/client';

export class QuickAddAnimalDto {
  @ApiProperty({
    description: 'Unique animal ear tag / identification number',
    example: 'COW-LK-9025',
  })
  @IsString()
  @IsNotEmpty()
  animalNumber: string;

  @ApiPropertyOptional({
    description: 'Animal nickname or registered name',
    example: 'Bessie',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Animal breed specification',
    example: 'Friesian',
  })
  @IsString()
  @IsOptional()
  breed?: string;

  @ApiPropertyOptional({
    description: 'Animal biological gender',
    enum: AnimalGender,
    example: AnimalGender.FEMALE,
  })
  @IsEnum(AnimalGender)
  @IsOptional()
  gender?: AnimalGender;

  @ApiPropertyOptional({
    description: 'Optional profile image URL',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
