import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';

export abstract class PasswordService {
  abstract forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }>;

  abstract resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;

  abstract changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;
}
