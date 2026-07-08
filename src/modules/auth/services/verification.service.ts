import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as crypto from 'crypto';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { MailService } from '../../mail/interfaces/mail-service.interface';
import { ResendVerificationDto } from '../dtos/resend-verification.dto';
import { VerificationService } from '../interfaces/verification-service.interface';

@Injectable()
export class MongooseVerificationService extends VerificationService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {
    super();
  }

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

  async resendVerification(
    dto: ResendVerificationDto,
  ): Promise<{ message: string }> {
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
}
