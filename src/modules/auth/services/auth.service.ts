import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { RegisterDto } from '../dtos/register.dto';
import { LoginDto } from '../dtos/login.dto';
import { User, UserDocument, UserRole } from '../../user/schemas/user.schema';
import { MailService } from '../../mail/interfaces/mail-service.interface';
import { AuthService } from '../interfaces/auth-service.interface';
import { TokenService } from '../interfaces/token-service.interface';

@Injectable()
export class MongooseAuthService extends AuthService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
    private readonly tokenService: TokenService,
  ) {
    super();
  }

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

    return this.tokenService.buildAuthResponse(user);
  }

  async logout(userId: string) {
    await this.userModel
      .findByIdAndUpdate(userId, { refreshTokenHash: null })
      .exec();
    return { message: 'Logged out successfully.' };
  }
}
