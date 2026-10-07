import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ClinicalCertainty } from '@prisma/client';

export class CreateClinicalExamDto {
  @ApiProperty({
    description: 'Animal Tag or Identification Number',
    example: 'COW-LK-5097',
  })
  @IsString({ message: 'Animal Tag must be text.' })
  @IsNotEmpty({ message: 'Animal is required.' })
  animalTag: string;

  @ApiPropertyOptional({
    description: 'Associated Health Case UUID',
  })
  @IsUUID()
  @IsOptional()
  caseId?: string;

  @ApiPropertyOptional({
    description: 'Date of Examination in ISO format',
  })
  @IsOptional()
  @IsString()
  examDate?: string;

  @ApiPropertyOptional({
    description: 'Rectal Temperature in Celsius',
    example: 39.5,
  })
  @IsNumber({}, { message: 'Please enter a valid number for temperature.' })
  @Min(30, { message: 'Please enter a valid temperature.' })
  @Max(45, { message: 'Please enter a valid temperature.' })
  @IsOptional()
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Heart Rate in beats per minute (BPM)',
    example: 78,
  })
  @IsNumber({}, { message: 'Please enter a valid number for heart rate.' })
  @Min(20, { message: 'Please enter a valid heart rate.' })
  @Max(200, { message: 'Please enter a valid heart rate.' })
  @IsOptional()
  heartRate?: number;

  @ApiPropertyOptional({
    description: 'Respiratory Rate in breaths per minute',
    example: 32,
  })
  @IsNumber(
    {},
    { message: 'Please enter a valid number for respiratory rate.' },
  )
  @Min(5, { message: 'Please enter a valid respiratory rate.' })
  @Max(120, { message: 'Please enter a valid respiratory rate.' })
  @IsOptional()
  respiratoryRate?: number;

  @ApiPropertyOptional({
    description: 'Rumen Motility contractions per 2 minutes (0-5)',
    example: 2,
  })
  @IsNumber({}, { message: 'Please enter a valid number for rumen motility.' })
  @Min(0, { message: 'Please enter a valid rumen motility.' })
  @Max(10, { message: 'Please enter a valid rumen motility.' })
  @IsOptional()
  rumenMotility?: number;

  @ApiPropertyOptional({
    description:
      'Mucous membranes examination findings (e.g. Pink, Pale, Hyperemic, Cyanotic, Icteric)',
    example: 'Hyperemic with oral mucosal vesicles',
  })
  @IsString()
  @IsOptional()
  mucousMembranes?: string;

  @ApiPropertyOptional({
    description: 'Body Condition Score (1.0 to 5.0 scale)',
    example: 3.5,
  })
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  @IsOptional()
  bodyConditionScore?: number;

  @ApiPropertyOptional({
    description: 'List of observed clinical signs / symptoms',
    example: ['Fever', 'Salivation', 'Hoof lesions', 'Lameness'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  clinicalSigns?: string[];

  @ApiPropertyOptional({
    description: 'Primary clinical assessment / tentative diagnosis',
    example: 'Suspected Foot and Mouth Disease (FMD)',
  })
  @IsString()
  @IsOptional()
  initialAssessment?: string;

  @ApiPropertyOptional({
    description: 'Associated Disease Code from Master (e.g. DIS-FMD)',
  })
  @IsString()
  @IsOptional()
  diseaseCode?: string;

  @ApiPropertyOptional({
    description: 'Diagnostic certainty level',
    enum: ClinicalCertainty,
    default: ClinicalCertainty.SUSPECTED,
  })
  @IsEnum(ClinicalCertainty)
  @IsOptional()
  certainty?: ClinicalCertainty;

  @ApiPropertyOptional({
    description: 'Additional clinical observations and instructions',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
