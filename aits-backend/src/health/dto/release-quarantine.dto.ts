import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class ReleaseQuarantineDto {
  @ApiProperty({
    description: 'Clinical and regulatory reason for release',
    example:
      'Mandatory 21-day quarantine completed with consecutive negative PCR results.',
  })
  @IsString()
  @IsNotEmpty()
  releaseReason: string;

  @ApiPropertyOptional({
    description: 'Confirmation that all release criteria have been met',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  releaseCriteriaMet?: boolean;

  @ApiPropertyOptional({
    description: 'Supporting negative laboratory test record UUID',
  })
  @IsUUID()
  @IsOptional()
  supportingLabResultId?: string;

  @ApiPropertyOptional({
    description: 'Veterinary examination notes upon release',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class RevokeClearanceDto {
  @ApiProperty({
    description: 'Regulatory or veterinary reason for certificate revocation',
    example:
      'New contagious disease outbreak detected on source farm prior to dispatch.',
  })
  @IsString()
  @IsNotEmpty()
  revocationReason: string;

  @ApiPropertyOptional({
    description: 'Additional notes or veterinary notification reference',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
