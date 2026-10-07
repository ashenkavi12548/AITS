import { Injectable } from '@nestjs/common';
import { MailSenderService } from './services';
import {
  SendEmployeeWelcomeOptions,
  SendPasswordResetOptions,
  SendScheduleAlertOptions,
} from './types/mail.types';

/**
 * Facade service for Mail operations.
 */
@Injectable()
export class MailService {
  constructor(private readonly mailSenderService: MailSenderService) {}

  async sendEmployeeWelcome(
    options: SendEmployeeWelcomeOptions,
  ): Promise<boolean> {
    return this.mailSenderService.sendEmployeeWelcome(options);
  }

  async sendPasswordResetEmail(
    options: SendPasswordResetOptions,
  ): Promise<boolean> {
    return this.mailSenderService.sendPasswordResetEmail(options);
  }

  async sendScheduleAlertEmail(
    options: SendScheduleAlertOptions,
  ): Promise<boolean> {
    return this.mailSenderService.sendScheduleAlertEmail(options);
  }
}
