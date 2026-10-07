import { Module, forwardRef } from '@nestjs/common';
import { AnimalsController } from './animals.controller';
import { AnimalsService } from './animals.service';
import {
  AnimalsQueryService,
  AnimalsCrudService,
  AnimalsIdentifiersService,
} from './services';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from '../common/cloudinary/cloudinary.module';
import { IdentifiersModule } from '../identifiers/identifiers.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => AuthModule),
    CloudinaryModule,
    IdentifiersModule,
    NotificationsModule,
  ],
  controllers: [AnimalsController],
  providers: [
    AnimalsService,
    AnimalsQueryService,
    AnimalsCrudService,
    AnimalsIdentifiersService,
  ],
  exports: [AnimalsService],
})
export class AnimalsModule {}
