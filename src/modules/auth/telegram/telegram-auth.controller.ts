import {
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiProperty,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiResponse,
  ApiHeader,
  ApiTags,
  ApiOkResponse,
  ApiConflictResponse,
  ApiUnauthorizedResponse,
  ApiTooManyRequestsResponse,
  ApiServiceUnavailableResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthSettings } from '@src/common/config/auth-configuration';
import { Public } from '@src/common';
import { routes } from '@libs/routes';
import { AuthCookies, AuthOriginGuard } from '../auth-http';
import { SessionDto } from '../dto/auth.dto';
import { TelegramAuthService } from './telegram-auth.service';
export const TELEGRAM_ATTEMPT_COOKIE = 'telegram_login_attempt';
export class TelegramCompleteDto {
  @ApiProperty({ format: 'uuid' }) @IsUUID() attemptId: string;
  @ApiProperty({
    maxLength: 8192,
    description: 'Подписанный id_token из Telegram Login JS callback',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(8192)
  idToken: string;
}
export class TelegramStartResponse {
  @ApiProperty({ format: 'uuid' }) attemptId: string;
  @ApiProperty({
    description: 'Публичный nonce для Telegram.Login.auth; не логировать',
  })
  nonce: string;
  @ApiProperty() clientId: string;
  @ApiProperty({ example: ['profile'] }) scope: string[];
  @ApiProperty({ format: 'date-time' }) expiresAt: string;
}
@ApiTags('auth/telegram')
@ApiHeader({
  name: 'Origin',
  required: true,
  description:
    'Точный разрешённый frontend origin; браузер добавляет автоматически',
})
@ApiBadRequestResponse({ description: 'Неверный JSON/DTO' })
@ApiForbiddenResponse({ description: 'Недопустимый Origin/Content-Type' })
@ApiResponse({ status: 413, description: 'Auth body больше 16 KiB' })
@Public()
@UseGuards(AuthOriginGuard)
@ApiUnauthorizedResponse({
  description: 'Неверный ID token, nonce, browser binding или expiry',
})
@ApiConflictResponse({
  description:
    'TELEGRAM_ATTEMPT_USED или конфликт внешней идентичности; без новых cookies',
})
@ApiTooManyRequestsResponse({
  description:
    'IP start 20/complete 60 за 15 минут; verified identity 10/15 минут',
})
@ApiServiceUnavailableResponse({
  description: 'TELEGRAM_KEYS_UNAVAILABLE: JWKS/лимит внешних запросов',
})
@Controller()
export class TelegramAuthController {
  private readonly settings: AuthSettings;
  constructor(
    config: ConfigService,
    private readonly telegram: TelegramAuthService,
    private readonly cookies: AuthCookies,
  ) {
    this.settings = config.get<AuthSettings>('auth');
  }
  private options() {
    return {
      httpOnly: true,
      secure: this.settings.cookieSecure,
      sameSite: this.settings.cookieSameSite,
      path: '/auth/telegram',
    };
  }
  @Post(routes.auth.telegramStart)
  @HttpCode(200)
  @ApiOkResponse({ type: TelegramStartResponse })
  @ApiOperation({
    summary:
      'Начать Telegram Login JS: одна активная попытка на browser cookie; TTL 300 секунд',
  })
  async start(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const attempt = await this.telegram.start(
      req.cookies?.[TELEGRAM_ATTEMPT_COOKIE],
    );
    res.cookie(TELEGRAM_ATTEMPT_COOKIE, attempt.browser, {
      ...this.options(),
      expires: new Date(attempt.expiresAt),
    });
    return attempt.body;
  }
  @Post(routes.auth.telegramComplete)
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  @ApiOperation({
    summary:
      'Однократно завершить попытку по подписанному id_token и browser cookie; raw callback user игнорируется',
  })
  async complete(
    @Body() body: TelegramCompleteDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.telegram.complete(
      body.attemptId,
      body.idToken,
      req.cookies?.[TELEGRAM_ATTEMPT_COOKIE],
    );
    this.cookies.set(res, session);
    // Keep the short-lived consumed binding cookie until TTL: a delayed completion
    // response must not clear a newer attempt cookie created by another tab.
    return session.body;
  }
}
