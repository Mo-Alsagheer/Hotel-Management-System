import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { EmailDto } from '../dtos/email.dto';
import { User, UserDocument, UserRole } from '../../user/schemas/user.schema';
import { MailService } from '../../mail/mail.service';
import { IAuthService } from '../interfaces/auth-service.interface';

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // --- Registration / Login / Logout ---

  async register(dto: RegisterDto, role: UserRole = UserRole.USER) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const existing = await this.userModel
      .findOne({
        email: dto.email.toLowerCase(),
      })
      .lean()
      .exec();
    if (existing) {
      throw new BadRequestException('Email is already registered.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.userModel.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      password: passwordHash,
      phone: dto.phone,
      profileImage: dto.profileImage,
      role,
      isEmailVerified: false,
      emailVerificationToken,
    });

    await this.mailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
    );

    return {
      message:
        'Registration successful. A verification link has been sent to your email.',
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .select('+password +emailVerificationToken +refreshTokenHash')
      .exec();

    if (!user) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException(
        'User account is deactivated or deleted.',
      );
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email address before logging in.',
      );
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: null })
      .exec();
    return { message: 'Logged out successfully.' };
  }

  // --- Token Operations ---

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

  // --- Verification ---

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ emailVerificationToken: token })
      .select('+emailVerificationToken')
      .exec();

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token.');
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    return { message: 'Email verified successfully.' };
  }

  async resendVerification(dto: EmailDto): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (user.isEmailVerified) {
      throw new BadRequestException('Email is already verified.');
    }

    const emailVerificationToken = await this.generateVerificationToken(
      user.email,
    );
    await this.mailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
    );

    return { message: 'Verification email sent successfully.' };
  }

  async generateVerificationToken(email: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { emailVerificationToken: token },
      )
      .exec();
    return token;
  }

  // --- Password Operations ---

  async forgotPassword(dto: EmailDto): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    await this.mailService.sendResetPasswordEmail(user.email, token);

    return { message: 'Password reset link sent successfully.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');
    const user = await this.userModel
      .findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: new Date() },
      })
      .select('+passwordResetToken +passwordResetExpires')
      .exec();

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully.' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('New passwords do not match.');
    }

    const user = await this.userModel
      .findById(userId)
      .select('+password')
      .exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await user.save();

    return { message: 'Password updated successfully.' };
  }
}
