import { Module, Global } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationDispatchService } from './services/notification-dispatch.service';
import { NotificationStreamService } from './services/notification-stream.service';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Global()
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationDispatchService,
    NotificationStreamService,
  ],
  exports: [
    NotificationsService,
    NotificationDispatchService,
    NotificationStreamService,
  ],
})
export class NotificationsModule {}
