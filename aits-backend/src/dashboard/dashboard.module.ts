import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DashboardHelpersService } from './services/dashboard-helpers.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { DashboardExportService } from './services/dashboard-export.service';
import { DashboardOperationsService } from './services/dashboard-operations.service';
import { DashboardCalendarService } from './services/dashboard-calendar.service';
import { DashboardAlertsService } from './services/dashboard-alerts.service';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    JwtModule.register({}),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardHelpersService,
    DashboardAnalyticsService,
    DashboardExportService,
    DashboardOperationsService,
    DashboardCalendarService,
    DashboardAlertsService,
    DashboardService,
  ],
  exports: [
    DashboardHelpersService,
    DashboardAnalyticsService,
    DashboardExportService,
    DashboardOperationsService,
    DashboardCalendarService,
    DashboardAlertsService,
    DashboardService,
  ],
})
export class DashboardModule {}
