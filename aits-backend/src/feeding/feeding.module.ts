import { Module } from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { FeedingController } from './feeding.controller';

@Module({
  controllers: [FeedingController],
  providers: [FeedingService],
  exports: [FeedingService],
})
export class FeedingModule {}
