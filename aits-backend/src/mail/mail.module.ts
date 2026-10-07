import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailSenderService } from './services';

@Global()
@Module({
  providers: [MailService, MailSenderService],
  exports: [MailService],
})
export class MailModule {}
