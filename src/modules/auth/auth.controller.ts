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
import { AuthService } from './interfaces/auth-service.interface';
import { TokenService } from './interfaces/token-service.interface';
import { VerificationService } from './interfaces/verification-service.interface';
import { PasswordService } from './interfaces/password-service.interface';
import { UserService } from '../user/interfaces/user-service.interface';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { ChangePasswordDto } from './dtos/change-password.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ResendVerificationDto } from './dtos/resend-verification.dto';
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
    private readonly tokenService: TokenService,
    private readonly verificationService: VerificationService,
    private readonly passwordService: PasswordService,
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
    return this.tokenService.refresh(dto.refreshToken);
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
    return this.verificationService.verifyEmail(token);
  }

  @SuccessMessage('Verification email sent successfully')
  @Post('resend-verification')
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.verificationService.resendVerification(dto);
  }

  @SuccessMessage('Password reset link sent successfully')
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordService.forgotPassword(dto);
  }

  @SuccessMessage('Password has been reset successfully')
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordService.resetPassword(dto);
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
    return this.passwordService.changePassword(user.userId, dto);
  }
}
