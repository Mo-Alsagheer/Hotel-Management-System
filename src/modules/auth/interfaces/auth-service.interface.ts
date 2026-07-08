import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { UserRole } from '../../user/schemas/user.schema';

export abstract class AuthService {
  abstract register(
    dto: RegisterDto,
    role?: UserRole,
  ): Promise<{ message: string }>;

  abstract login(dto: LoginDto): Promise<{
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

  abstract logout(userId: string): Promise<{ message: string }>;
}
