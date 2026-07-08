import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../user/schemas/user.schema';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

// Concrete implementations
import { MongooseAuthService } from './services/auth.service';
import { MongooseTokenService } from './services/token.service';
import { MongooseVerificationService } from './services/verification.service';
import { MongoosePasswordService } from './services/password.service';

// Abstract class contracts
import { AuthService } from './interfaces/auth-service.interface';
import { TokenService } from './interfaces/token-service.interface';
import { VerificationService } from './interfaces/verification-service.interface';
import { PasswordService } from './interfaces/password-service.interface';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') ?? '7d';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            expiresIn: expiresIn as any,
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
    MailModule,
  ],
  controllers: [AuthController],
  providers: [
    { provide: AuthService, useClass: MongooseAuthService },
    { provide: TokenService, useClass: MongooseTokenService },
    { provide: VerificationService, useClass: MongooseVerificationService },
    { provide: PasswordService, useClass: MongoosePasswordService },
    JwtStrategy,
  ],
  exports: [AuthService, TokenService, VerificationService, PasswordService],
})
export class AuthModule {}
