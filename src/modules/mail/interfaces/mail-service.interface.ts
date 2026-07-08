export abstract class MailService {
  abstract sendVerificationEmail(email: string, token: string): Promise<void>;

  abstract sendResetPasswordEmail(email: string, token: string): Promise<void>;
}
