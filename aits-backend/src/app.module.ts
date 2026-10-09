import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { FarmsModule } from './farms/farms.module';
import { AnimalsModule } from './animals/animals.module';
import { IdentifiersModule } from './identifiers/identifiers.module';
import { QrModule } from './qr/qr.module';
import { HealthModule } from './health/health.module';
import { DiseasesModule } from './diseases/diseases.module';
import { VaccinationsModule } from './vaccinations/vaccinations.module';
import { TreatmentsModule } from './treatments/treatments.module';
import { VeterinaryModule } from './veterinary/veterinary.module';
import { FeedingModule } from './feeding/feeding.module';
import { MilkProductionModule } from './milk-production/milk-production.module';
import { BreedingModule } from './breeding/breeding.module';
import { PregnancyModule } from './pregnancy/pregnancy.module';
import { CalvingModule } from './calving/calving.module';
import { MovementsModule } from './movements/movements.module';
import { OwnershipModule } from './ownership/ownership.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SynchronizationModule } from './synchronization/synchronization.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { DashboardModule } from './dashboard/dashboard.module';

import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { TraceabilityModule } from './traceability/traceability.module';
import { TasksModule } from './tasks/tasks.module';
import { BusinessRulesModule } from './common/business-rules/business-rules.module';

@Module({
  imports: [
    BusinessRulesModule,
    CloudinaryModule,

    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    FarmsModule,
    AnimalsModule,
    IdentifiersModule,
    QrModule,
    HealthModule,
    DiseasesModule,
    VaccinationsModule,
    TreatmentsModule,
    VeterinaryModule,
    FeedingModule,
    MilkProductionModule,
    BreedingModule,
    PregnancyModule,
    CalvingModule,
    MovementsModule,
    OwnershipModule,
    DocumentsModule,
    NotificationsModule,
    SynchronizationModule,
    AuditModule,
    ReportsModule,
    DashboardModule,
    TraceabilityModule,
    TasksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
