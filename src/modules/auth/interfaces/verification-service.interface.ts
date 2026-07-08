import { ResendVerificationDto } from '../dtos/resend-verification.dto';

export abstract class VerificationService {
  abstract verifyEmail(token: string): Promise<{ message: string }>;

  abstract resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }>;

  abstract generateVerificationToken(email: string): Promise<string>;
}
