import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export type ReportType =
  | 'OVERVIEW'
  | 'PRODUCTION'
  | 'HEALTH'
  | 'FEEDING'
  | 'BREEDING'
  | 'TRACEABILITY'
  | 'ANIMAL_LIFETIME';

export type ReportFileFormat = 'PDF' | 'CSV' | 'PRINT';

export class ReportFilterDto {
  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  animalId?: string;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  animalStatus?: string;

  @IsOptional()
  @IsString()
  reportStatus?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  diagnosis?: string;

  @IsOptional()
  @IsString()
  pregnancyStatus?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === 1)
  @IsBoolean()
  compareWithPrevious?: boolean = true;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class ReportDownloadRequestDto {
  @IsString()
  reportType!: ReportType;

  @IsOptional()
  @IsString()
  reportId?: string;

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
  status?: string;

  @IsOptional()
  @IsIn(['PDF', 'CSV', 'PRINT'])
  fileFormat?: ReportFileFormat = 'PDF';

  @IsOptional()
  @IsIn(['AUTOMATIC', 'PORTRAIT', 'LANDSCAPE'])
  pageOrientation?: 'AUTOMATIC' | 'PORTRAIT' | 'LANDSCAPE' = 'LANDSCAPE';

  @IsOptional()
  @IsBoolean()
  includeSummaryCards?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeCharts?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeDetailedTable?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeConfidentialLabel?: boolean = false;

  @IsOptional()
  @IsBoolean()
  isExport?: boolean;

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  animalStatus?: string;

  @IsOptional()
  @IsString()
  reportStatus?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsBoolean()
  compareWithPrevious?: boolean;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  limit?: number;
}
