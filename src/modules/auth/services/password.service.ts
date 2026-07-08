import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../../user/schemas/user.schema';
import { MailService } from '../../mail/interfaces/mail-service.interface';
import { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { ChangePasswordDto } from '../dtos/change-password.dto';
import { PasswordService } from '../interfaces/password-service.interface';

@Injectable()
export class MongoosePasswordService extends PasswordService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly mailService: MailService,
  ) {
    super();
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userModel
      .findOne({ email: dto.email.toLowerCase() })
      .exec();
    if (!user) {
      throw new NotFoundException('User with this email does not exist.');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000); // 1 hour

    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    await this.mailService.sendResetPasswordEmail(user.email, token);

    return { message: 'Password reset link sent successfully.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    if (dto.newPassword !== dto.confirmNewPassword) {
      throw new BadRequestException('Passwords do not match.');
    }

    const user = await this.userModel
      .findOne({
        passwordResetToken: dto.token,
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
