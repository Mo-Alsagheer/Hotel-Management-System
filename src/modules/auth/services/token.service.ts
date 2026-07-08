import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../../user/schemas/user.schema';
import {
  TokenService,
  RefreshTokenPayload,
} from '../interfaces/token-service.interface';

@Injectable()
export class MongooseTokenService extends TokenService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async buildAuthResponse(user: UserDocument) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'change_me_refresh_secret';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      expiresIn: refreshExpiresIn as any,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    user.refreshTokenHash = refreshTokenHash;
    await user.save();

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: RefreshTokenPayload;
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'change_me_refresh_secret';
      payload = this.jwtService.verify<RefreshTokenPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.userModel
      .findById(payload.sub)
      .select('+refreshTokenHash')
      .exec();

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

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or revoked refresh token.');
    }

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    return this.buildAuthResponse(user);
  }
}
