import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { HealthStateService } from './health-state.service';
import { SurveillanceService } from './surveillance.service';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

import { AnimalBusinessRulesService } from '../common/business-rules/animal-business-rules.service';
import { HealthTreatmentService } from './services/health-treatment.service';
import { HealthVaccinationService } from './services/health-vaccination.service';
import { HealthQuarantineService } from './services/health-quarantine.service';
import { HealthDiagnosisService } from './services/health-diagnosis.service';
import { HealthLabService } from './services/health-lab.service';
import { HealthCoreService } from './services/health-core.service';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [HealthController],
  providers: [
    HealthService,
    HealthStateService,
    SurveillanceService,
    AnimalBusinessRulesService,
    HealthTreatmentService,
    HealthVaccinationService,
    HealthQuarantineService,
    HealthDiagnosisService,
    HealthLabService,
    HealthCoreService,
  ],
  exports: [HealthService, HealthStateService, SurveillanceService],
})
export class HealthModule {}
