import { Module } from '@nestjs/common';
import { BreedingController } from './breeding.controller';
import { BreedingService } from './breeding.service';
import {
  BreedingRecordsService,
  BreedingQueryService,
  PregnancyService,
  CalvingService,
} from './services';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { BusinessRulesModule } from '../common/business-rules/business-rules.module';

@Module({
  imports: [PrismaModule, AuthModule, BusinessRulesModule],
  controllers: [BreedingController],
  providers: [
    BreedingService,
    BreedingRecordsService,
    BreedingQueryService,
    PregnancyService,
    CalvingService,
  ],
  exports: [BreedingService],
})
export class BreedingModule {}
