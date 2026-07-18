import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { EmailDto } from '../dtos/email.dto';
import { UserDocument, UserRole } from '../../user/schemas/user.schema';

export interface IAuthService {
  register(dto: RegisterDto, role?: UserRole): Promise<{ message: string }>;
  login(dto: LoginDto): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: any;
      name: string;
      email: string;
      phone?: string;
      profileImage?: string;
      role: UserRole;
      isActive: boolean;
    };
  }>;
  logout(userId: string): Promise<{ message: string }>;
  buildAuthResponse(user: UserDocument): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: any;
      name: string;
      email: string;
      phone?: string;
      profileImage?: string;
      role: UserRole;
      isActive: boolean;
    };
  }>;
  refresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: any;
      name: string;
      email: string;
      phone?: string;
      profileImage?: string;
      role: UserRole;
      isActive: boolean;
    };
  }>;
  verifyEmail(token: string): Promise<{ message: string }>;
  resendVerification(dto: EmailDto): Promise<{ message: string }>;
  generateVerificationToken(email: string): Promise<string>;
  forgotPassword(dto: EmailDto): Promise<{ message: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ message: string }>;
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }>;
}
