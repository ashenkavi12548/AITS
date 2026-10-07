import { Module } from '@nestjs/common';
import { TraceabilityController } from './traceability.controller';
import { TraceabilityService } from './traceability.service';
import { DailyActivityService } from './services/daily-activity.service';
import { FarmTransferService } from './services/farm-transfer.service';
import { AnimalTraceService } from './services/animal-trace.service';
import { PrismaModule } from '../database/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, NotificationsModule, AuthModule],
  controllers: [TraceabilityController],
  providers: [
    TraceabilityService,
    DailyActivityService,
    FarmTransferService,
    AnimalTraceService,
  ],
  exports: [
    TraceabilityService,
    DailyActivityService,
    FarmTransferService,
    AnimalTraceService,
  ],
})
export class TraceabilityModule {}
