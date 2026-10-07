import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReportsController } from './reports.controller';
import { DashboardModule } from '../dashboard/dashboard.module';
import { TraceabilityModule } from '../traceability/traceability.module';

@Module({
  imports: [DashboardModule, TraceabilityModule, JwtModule.register({})],
  controllers: [ReportsController],
})
export class ReportsModule {}
