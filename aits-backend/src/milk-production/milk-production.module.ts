import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MilkProductionController } from './milk-production.controller';
import { MilkProductionService } from './milk-production.service';
import { MilkProductionQueryService } from './services/milk-production-query.service';
import { MilkProductionStatsService } from './services/milk-production-stats.service';
import { MilkProductionCrudService } from './services/milk-production-crud.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [MilkProductionController],
  providers: [
    MilkProductionService,
    MilkProductionQueryService,
    MilkProductionStatsService,
    MilkProductionCrudService,
  ],
  exports: [MilkProductionService],
})
export class MilkProductionModule {}
