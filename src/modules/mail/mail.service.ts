import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import {
  getVerificationEmailTemplate,
  getResetPasswordEmailTemplate,
} from './templates';
import { IMailService } from './interfaces/mail-service.interface';

@Injectable()
export class MailService implements IMailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter?: nodemailer.Transporter;
  private readonly fromAddress: string;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');
    this.fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      '"Hotel Management" <noreply@hotel.com>';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for port 465, false for others
        auth: {
          user,
          pass,
        },
      });
      this.logger.log('Nodemailer SMTP Transporter initialized successfully.');
    } else {
      this.logger.warn(
        'SMTP configuration is incomplete. MailService will fall back to logging emails to the console.',
      );
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const url = `http://localhost:3000/api/auth/verify-email?token=${token}`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: 'Verify Your Email Address - Hotel Management System',
          html: getVerificationEmailTemplate(url),
        });
        this.logger.log(`Verification email sent successfully to: ${email}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send verification email via SMTP to ${email}. Falling back to console log.`,
          error instanceof Error ? error.stack : error,
        );
      }
    }

    // Fallback logging
    this.logger.log(`
==================================================================
[FALLBACK LOGGER] EMAIL VERIFICATION
To: ${email}
URL: ${url}
==================================================================
    `);
  }

  async sendResetPasswordEmail(email: string, token: string): Promise<void> {
    const url = `http://localhost:3000/api/auth/reset-password`;

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to: email,
          subject: 'Reset Your Password - Hotel Management System',
          html: getResetPasswordEmailTemplate(url, token),
        });
        this.logger.log(`Password reset email sent successfully to: ${email}`);
        return;
      } catch (error) {
        this.logger.error(
          `Failed to send password reset email via SMTP to ${email}. Falling back to console log.`,
          error instanceof Error ? error.stack : error,
        );
      }
    }

    // Fallback logging
    this.logger.log(`
==================================================================
[FALLBACK LOGGER] PASSWORD RESET REQUEST
To: ${email}
Instructions: POST to ${url}
Payload: { "token": "${token}", "newPassword": "...", "confirmNewPassword": "..." }
==================================================================
    `);
  }
}
