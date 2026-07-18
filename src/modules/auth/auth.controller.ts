import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './services/auth.service';
import { UserService } from '../user/user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { EmailDto } from './dtos/email.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  ICurrentUser,
} from '../../common/decorators/current-user.decorator';
import { SuccessMessage } from '../../common/decorators/success-message.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @SuccessMessage(
    'Registration successful. A verification link has been sent to your email.',
  )
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @SuccessMessage('Logged in successfully')
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @SuccessMessage('Token refreshed successfully')
  @Post('refresh-token')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Logged out successfully')
  @Post('logout')
  logout(@CurrentUser() user: ICurrentUser) {
    return this.authService.logout(user.userId);
  }

  @SuccessMessage('Email verified successfully')
  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @SuccessMessage('Verification email sent successfully')
  @Post('resend-verification')
  resendVerification(@Body() dto: EmailDto) {
    return this.authService.resendVerification(dto);
  }

  @SuccessMessage('Password reset link sent successfully')
  @Post('forgot-password')
  forgotPassword(@Body() dto: EmailDto) {
    return this.authService.forgotPassword(dto);
  }

  @SuccessMessage('Password has been reset successfully')
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Profile retrieved successfully')
  @Get('me')
  getMe(@CurrentUser() user: ICurrentUser) {
    return this.userService.findOneById(user.userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Profile updated successfully')
  @Put('me')
  updateProfile(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(user.userId, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @SuccessMessage('Password changed successfully')
  @Put('change-password')
  changePassword(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, dto);
  }
}
