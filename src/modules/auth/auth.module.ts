import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthCommandHandler, AuthUnitOfWork } from '@modules/auth/commands';
import { AuthCookies, AuthCsrfGuard, AuthOriginGuard } from './auth-http';
import { AuthRateLimitService } from './auth-rate-limit.service';
import {
  AuthMailService,
  MailTransport,
  PostboxTransport,
} from './mail/auth-mail.service';
import { TelegramAuthController } from './telegram/telegram-auth.controller';
import { TelegramAuthService } from './telegram/telegram-auth.service';
import { TelegramTokenService } from './telegram/telegram-token.service';
import { GetOwnProfileHandler } from './queries/get-own-profile.query';
@Module({
  imports: [JwtModule.register({}), CqrsModule],
  controllers: [AuthController, TelegramAuthController],
  providers: [
    TelegramAuthService,
    TelegramTokenService,
    JwtAccessStrategy,
    AuthService,
    AuthCommandHandler,
    AuthUnitOfWork,
    AuthCookies,
    AuthCsrfGuard,
    AuthOriginGuard,
    AuthRateLimitService,
    AuthMailService,
    { provide: MailTransport, useClass: PostboxTransport },
    GetOwnProfileHandler,
  ],
})
export class AuthModule {}
