import { PartialType } from '@nestjs/mapped-types';
import { CreateFeedingRecordDto } from './create-feeding-record.dto';

export class UpdateFeedingRecordDto extends PartialType(
  CreateFeedingRecordDto,
) {}
