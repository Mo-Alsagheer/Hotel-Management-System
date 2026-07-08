import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../modules/user/schemas/user.schema';
import { UserService } from '../../modules/user/interfaces/user-service.interface';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService
      .findOneById(payload.sub)
      .catch(() => null);
    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deactivated or deleted.',
      );
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email address.');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
