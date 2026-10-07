import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import {
  SendVerificationEmailOptions,
  SendEmployeeWelcomeOptions,
  SendPasswordResetOptions,
  SendScheduleAlertOptions,
} from '../types/mail.types';
import { buildEmailTemplate } from '../utils/mail-template.util';

@Injectable()
export class MailSenderService {
  private readonly logger = new Logger(MailSenderService.name);
  private transporter: nodemailer.Transporter | null = null;

  private readonly host = process.env.SMTP_HOST || '';
  private readonly port = parseInt(process.env.SMTP_PORT || '587', 10);
  private readonly secure = process.env.SMTP_SECURE === 'true';
  private readonly user = process.env.SMTP_USER || '';
  private readonly pass = process.env.SMTP_PASS || '';
  private readonly from =
    process.env.SMTP_FROM || 'AITS <ceylonnest.org@gmail.com>';
  private readonly frontendUrl =
    process.env.FRONTEND_URL || 'http://localhost:3000';

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    if (this.host && this.host.trim() !== '') {
      try {
        const sanitizedPass = this.pass ? this.pass.replace(/\s+/g, '') : '';

        // Respect explicitly configured port and secure settings. 
        // For Gmail: port 465 uses secure: true, port 587 uses secure: false (STARTTLS)
        this.transporter = nodemailer.createTransport({
          host: this.host,
          port: this.port,
          secure: this.secure,
          auth:
            this.user && this.pass
              ? {
                  user: this.user,
                  pass: sanitizedPass || this.pass,
                }
              : undefined,
          tls: {
            rejectUnauthorized: false,
          },
          // Short timeout to prevent hanging the backend (10 seconds)
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
        });

        this.logger.log(
          `Nodemailer transporter initialized for host: ${this.host}:${this.port}`,
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to initialize Nodemailer transporter: ${errorMsg}`,
        );
        this.transporter = null;
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        this.logger.warn('SMTP_HOST is empty in production. Email dispatch is disabled.');
      } else {
        this.logger.log(
          'SMTP_HOST is empty. Running in development/mock mail mode (verification links will be logged to console).',
        );
      }
      this.transporter = null;
    }
  }

  /**
   * Send Email Verification OTP & Link to Farmer / User
   */
  async sendVerificationEmail(
    options: SendVerificationEmailOptions,
  ): Promise<boolean> {
    const { to, firstName, token, otp } = options;
    const displayOtp = otp || token;
    const verificationUrl = `${this.frontendUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

    const contentHtml = `
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.5px;">
        Verify Your Farm Account
      </h1>
      
      <p style="margin: 0 0 14px 0; color: #334155; font-size: 15px;">
        Hello <strong style="color: #0f172a;">${firstName}</strong>,
      </p>

      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 22px;">
        Thank you for registering with the <strong>Animal Identification &amp; Traceability System (AITS)</strong>. To activate your account and secure your farm workspace, please use the verification code below:
      </p>

      <!-- OTP Card Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center" style="background-color: #f0fdf4; border: 2px dashed #10a37f; border-radius: 16px; padding: 24px 16px; text-align: center;">
            <div style="font-size: 11px; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
              Your One-Time Verification Code
            </div>
            <div class="otp-text" style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 38px; font-weight: 800; letter-spacing: 12px; color: #065f46; margin: 4px 0 10px 10px; line-height: 1.2;">
              ${displayOtp}
            </div>
            <div style="font-size: 12px; color: #047857; font-weight: 600;">
              &#9201; Expires in 15 minutes &bull; Single-use verification
            </div>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #10a37f; box-shadow: 0 4px 14px rgba(16, 163, 127, 0.35);">
                  <a href="${verificationUrl}" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; display: inline-block; letter-spacing: 0.2px;">
                    Verify Account Automatically &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Fallback Link Section -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 18px;">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
              Having trouble with the button? Copy and paste this URL into your browser:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-family: monospace; font-size: 11px; word-break: break-all; color: #475569;">
              <a href="${verificationUrl}" style="color: #10a37f; text-decoration: underline;">${verificationUrl}</a>
            </div>
          </td>
        </tr>
      </table>
    `;

    const htmlContent = buildEmailTemplate({
      badgeText: 'Official Verification',
      headline: 'Verify Your AITS Account',
      preheader: `Your AITS verification code is ${displayOtp}. Complete your farm registration now.`,
      contentHtml,
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to,
          subject: `AITS Verification Code: ${displayOtp}`,
          html: htmlContent,
        });
        this.logger.log(`Verification OTP successfully dispatched to ${to}`);
        return true;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send email via SMTP to ${to}: ${errorMsg}`,
        );
        this.logFallbackVerification(to, displayOtp, verificationUrl);
        return false;
      }
    } else {
      this.logFallbackVerification(to, displayOtp, verificationUrl);
      return true;
    }
  }

  /**
   * Send Employee / Staff Welcome Email with credentials
   */
  async sendEmployeeWelcome(
    options: SendEmployeeWelcomeOptions,
  ): Promise<boolean> {
    const { to, firstName, farmName, role, temporaryPassword, loginUrl } =
      options;
    const targetLoginUrl = loginUrl || `${this.frontendUrl}/login`;

    const contentHtml = `
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.5px;">
        Welcome to ${farmName}
      </h1>
      
      <p style="margin: 0 0 14px 0; color: #334155; font-size: 15px;">
        Hello <strong style="color: #0f172a;">${firstName}</strong>,
      </p>

      <p style="margin: 0 0 20px 0; color: #475569; font-size: 14px; line-height: 22px;">
        You have been added as an official team member on the <strong>Animal Identification &amp; Traceability System (AITS)</strong> for <strong>${farmName}</strong>.
      </p>

      <!-- Account Summary Card -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px;">
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b;" width="130"><strong>Farm:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${farmName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>Assigned Role:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #10a37f; font-weight: 700;">${role}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>Email / Username:</strong></td>
                <td style="padding: 6px 0; font-size: 13px; color: #0f172a; font-weight: 600;">${to}</td>
              </tr>
              ${
                temporaryPassword
                  ? `
              <tr>
                <td style="padding: 6px 0; font-size: 13px; color: #64748b;"><strong>Temp Password:</strong></td>
                <td style="padding: 6px 0; font-family: monospace; font-size: 13px; color: #047857; font-weight: 700;">${temporaryPassword}</td>
              </tr>
              `
                  : ''
              }
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 20px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #10a37f; box-shadow: 0 4px 14px rgba(16, 163, 127, 0.35);">
                  <a href="${targetLoginUrl}" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; display: inline-block;">
                    Sign In to Farm Workspace &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    `;

    const htmlContent = buildEmailTemplate({
      badgeText: 'Team Invitation',
      headline: `Welcome to ${farmName} on AITS`,
      preheader: `You have been added to ${farmName} as a ${role}. Sign in now to get started.`,
      contentHtml,
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to,
          subject: `Welcome to ${farmName} on AITS`,
          html: htmlContent,
        });
        this.logger.log(`Employee welcome email sent to ${to}`);
        return true;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to send welcome email to ${to}: ${errorMsg}`);
        return false;
      }
    }
    return true;
  }

  /**
   * Send Password Reset Link / OTP
   */
  async sendPasswordResetEmail(
    options: SendPasswordResetOptions,
  ): Promise<boolean> {
    const { to, firstName, resetToken, resetUrl } = options;
    const targetResetUrl =
      resetUrl ||
      `${this.frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}&email=${encodeURIComponent(to)}`;

    const contentHtml = `
      <h1 style="font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0; letter-spacing: -0.5px;">
        Reset Your AITS Password
      </h1>
      
      <p style="margin: 0 0 14px 0; color: #334155; font-size: 15px;">
        Hello <strong style="color: #0f172a;">${firstName}</strong>,
      </p>

      <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 22px;">
        We received a request to reset your password for your <strong>Animal Identification &amp; Traceability System (AITS)</strong> account. Click the button below to set a new password:
      </p>

      <!-- CTA Button -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 24px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="border-radius: 12px; background-color: #10a37f; box-shadow: 0 4px 14px rgba(16, 163, 127, 0.35);">
                  <a href="${targetResetUrl}" target="_blank" style="font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 12px; font-weight: 700; display: inline-block;">
                    Reset Password Now &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- Fallback Link Section -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 18px;">
        <tr>
          <td>
            <p style="margin: 0 0 8px 0; font-size: 12px; color: #64748b;">
              Or copy and paste this URL into your browser:
            </p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; font-family: monospace; font-size: 11px; word-break: break-all; color: #475569;">
              <a href="${targetResetUrl}" style="color: #10a37f; text-decoration: underline;">${targetResetUrl}</a>
            </div>
          </td>
        </tr>
      </table>
    `;

    const htmlContent = buildEmailTemplate({
      badgeText: 'Password Recovery',
      headline: 'Reset Your AITS Password',
      preheader: 'You requested a password reset for your AITS account.',
      contentHtml,
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to,
          subject: 'AITS Account - Reset Your Password',
          html: htmlContent,
        });
        this.logger.log(`Password reset email sent to ${to}`);
        return true;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send password reset email to ${to}: ${errorMsg}`,
        );
        return false;
      }
    }
    return true;
  }

  /**
   * Sends an automated email alert for upcoming veterinary schedules
   * (Vaccinations, Treatments, Calving dates, and Follow-ups).
   */
  async sendScheduleAlertEmail(
    options: SendScheduleAlertOptions,
  ): Promise<boolean> {
    const {
      to,
      recipientName,
      eventTitle,
      eventType,
      animalNumber,
      animalSpecies,
      animalBreed,
      scheduledDate,
      farmName,
      notes,
      doseOrMedication,
      actionUrl,
    } = options;

    const formattedDate = new Date(scheduledDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetUrl = actionUrl || `${this.frontendUrl}/dashboard`;

    const contentHtml = `
      <div style="margin-bottom: 24px;">
        <h1 style="color: #0f172a; font-size: 22px; font-weight: 800; margin: 0 0 8px 0; letter-spacing: -0.5px;">
          Upcoming Veterinary Schedule Alert
        </h1>
        <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 22px;">
          Hello <strong>${recipientName}</strong>, this is an automated notification for an upcoming veterinary activity recorded on AITS.
        </p>
      </div>

      <!-- Schedule Card -->
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="padding-bottom: 12px;">
              <span style="display: inline-block; background-color: #ecfdf5; color: #047857; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; border: 1px solid #a7f3d0; text-transform: uppercase;">
                ${eventType}
              </span>
            </td>
          </tr>
          <tr>
            <td style="font-size: 18px; font-weight: 700; color: #0f172a; padding-bottom: 16px;">
              ${eventTitle}
            </td>
          </tr>
          <tr>
            <td>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px; line-height: 20px;">
                <tr>
                  <td style="color: #64748b; width: 140px; padding: 6px 0;">Animal Ear Tag:</td>
                  <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">#${animalNumber}</td>
                </tr>
                ${
                  animalBreed || animalSpecies
                    ? `<tr>
                  <td style="color: #64748b; padding: 6px 0;">Species / Breed:</td>
                  <td style="color: #0f172a; padding: 6px 0;">${animalBreed ? `${animalBreed} ` : ''}${animalSpecies || ''}</td>
                </tr>`
                    : ''
                }
                ${
                  farmName
                    ? `<tr>
                  <td style="color: #64748b; padding: 6px 0;">Farm / Location:</td>
                  <td style="color: #0f172a; padding: 6px 0;">${farmName}</td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="color: #64748b; padding: 6px 0;">Scheduled Date:</td>
                  <td style="color: #047857; font-weight: 700; padding: 6px 0;">${formattedDate}</td>
                </tr>
                ${
                  doseOrMedication
                    ? `<tr>
                  <td style="color: #64748b; padding: 6px 0;">Medication / Dose:</td>
                  <td style="color: #0f172a; font-weight: 600; padding: 6px 0;">${doseOrMedication}</td>
                </tr>`
                    : ''
                }
                ${
                  notes
                    ? `<tr>
                  <td style="color: #64748b; padding: 6px 0; vertical-align: top;">Instructions / Notes:</td>
                  <td style="color: #334155; padding: 6px 0;">${notes}</td>
                </tr>`
                    : ''
                }
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${targetUrl}" style="display: inline-block; background-color: #10a37f; color: #ffffff; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; box-shadow: 0 4px 12px rgba(16, 163, 127, 0.25);">
          View on AITS Dashboard &rarr;
        </a>
      </div>
    `;

    const htmlContent = buildEmailTemplate({
      badgeText: 'SCHEDULE ALERT',
      headline: `AITS Schedule Alert: ${eventTitle} (#${animalNumber})`,
      preheader: `Upcoming ${eventType} scheduled on ${formattedDate} for animal #${animalNumber}`,
      contentHtml,
    });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.from,
          to,
          subject: `AITS Schedule Alert: ${eventTitle} (#${animalNumber})`,
          html: htmlContent,
        });
        this.logger.log(`Schedule alert email sent to ${to}`);
        return true;
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(
          `Failed to send schedule alert email to ${to}: ${errorMsg}`,
        );
        return false;
      }
    } else {
      this.logger.log(
        `\n=======================================================\n` +
          `[VETERINARY SCHEDULE EMAIL DISPATCH (DEV MODE)]\n` +
          `To: ${to}\n` +
          `Recipient: ${recipientName}\n` +
          `Subject: AITS Schedule Alert: ${eventTitle} (#${animalNumber})\n` +
          `Event: ${eventType} - ${eventTitle}\n` +
          `Animal: #${animalNumber} (${animalBreed || ''} ${animalSpecies || ''})\n` +
          `Date: ${formattedDate}\n` +
          `Link: ${targetUrl}\n` +
          `=======================================================\n`,
      );
      return true;
    }
  }

  private logFallbackVerification(to: string, otp: string, url: string) {
    if (process.env.NODE_ENV === 'production') {
      this.logger.warn(
        `[DEV / MOCK EMAIL DISPATCH] Mock dispatch bypassed in production for ${to}. Email was NOT sent.`,
      );
      return;
    }
    this.logger.warn(
      `\n=======================================================\n` +
        `[DEV / MOCK EMAIL DISPATCH]\n` +
        `To: ${to}\n` +
        `Subject: Your AITS Verification Code: ${otp}\n` +
        `OTP Code: ${otp}\n` +
        `Verification Link: ${url}\n` +
        `=======================================================\n`,
    );
  }
}
