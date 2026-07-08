import { UserDocument, UserRole } from '../../user/schemas/user.schema';

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export abstract class TokenService {
  abstract buildAuthResponse(user: UserDocument): Promise<{
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

  abstract refresh(refreshToken: string): Promise<{
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
}
