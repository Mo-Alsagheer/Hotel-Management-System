export interface IMailService {
  sendVerificationEmail(email: string, token: string): Promise<void>;
  sendResetPasswordEmail(email: string, token: string): Promise<void>;
}
