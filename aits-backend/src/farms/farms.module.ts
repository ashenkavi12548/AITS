import { Module } from '@nestjs/common';
import { FarmsController } from './farms.controller';
import { FarmsService } from './farms.service';
import { PrismaModule } from '../database/prisma.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import {
  FarmsQueryService,
  FarmsCrudService,
  FarmsEmployeesService,
} from './services';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [FarmsController],
  providers: [
    FarmsService,
    FarmsQueryService,
    FarmsCrudService,
    FarmsEmployeesService,
  ],
  exports: [FarmsService],
})
export class FarmsModule {}
