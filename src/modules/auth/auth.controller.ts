import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { QueryBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';
import { Public } from '@src/common';
import { routes } from '@libs/routes';
import { AuthService } from './auth.service';
import {
  AuthCookies,
  AuthCsrfGuard,
  AuthOriginGuard,
  CSRF_COOKIE,
} from './auth-http';
import {
  EmailDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  TokenDto,
  MessageDto,
  SessionDto,
  ProfileDto,
} from './dto/auth.dto';
import { GetOwnProfileQuery } from './queries/get-own-profile.query';

@ApiTags('auth')
@ApiBadRequestResponse({
  description:
    'Некорректный DTO или недействительная/истёкшая одноразовая ссылка',
})
@ApiUnauthorizedResponse({
  description: 'Неверные данные, неподтверждённая почта или отозванная сессия',
})
@ApiForbiddenResponse({ description: 'Origin/CSRF не прошли проверку' })
@ApiTooManyRequestsResponse({
  description:
    'IP/account limit или cooldown письма; см. docs/auth/email-auth.md',
})
@Controller()
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookies: AuthCookies,
    private readonly queries: QueryBus,
  ) {}
  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.register)
  @HttpCode(202)
  @ApiOperation({
    summary: 'Регистрация; роль user; без сессии до подтверждения email',
    description:
      '5/account и 15/IP за 15 мин; почтовый cooldown 60 секунд. Ответ нейтральный.',
  })
  @ApiResponse({ status: 202, type: MessageDto })
  register(@Body() body: RegisterDto, @Req() req: Request) {
    return this.auth.register(body.email, body.password, req.ip);
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.verifyEmail)
  @HttpCode(200)
  @ApiOkResponse({ type: MessageDto })
  verify(@Body() body: TokenDto, @Req() req: Request) {
    return this.auth.verifyEmail(body.token, req.ip);
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.resend)
  @HttpCode(202)
  @ApiResponse({ status: 202, type: MessageDto })
  resend(@Body() body: EmailDto, @Req() req: Request) {
    return this.auth.requestToken(body.email, 'verify-email', req.ip);
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.forgotPassword)
  @HttpCode(202)
  @ApiResponse({ status: 202, type: MessageDto })
  forgot(@Body() body: EmailDto, @Req() req: Request) {
    return this.auth.requestToken(body.email, 'reset-password', req.ip);
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.resetPassword)
  @HttpCode(200)
  @ApiOkResponse({ type: MessageDto })
  reset(@Body() body: ResetPasswordDto, @Req() req: Request) {
    return this.auth.resetPassword(body.token, body.password, req.ip);
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @Post(routes.auth.login)
  @HttpCode(200)
  @ApiOkResponse({ type: SessionDto })
  @ApiOperation({
    summary: 'Вход; refresh только в HttpOnly-cookie',
    description:
      '10/account и 30/IP за 15 мин; общий отказ для неизвестного email, неверного пароля и неподтверждённой почты.',
  })
  async login(
    @Body() body: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const session = await this.auth.login(body.email, body.password, req.ip);
    this.cookies.set(res, session);
    return session.body;
  }

  @Public()
  @UseGuards(AuthOriginGuard, AuthCsrfGuard)
  @ApiConflictResponse({
    description:
      'REFRESH_ALREADY_ROTATED: непосредственный дубль, без Set-Cookie и отзыва сессии',
  })
  @Post(routes.auth.refresh)
  @HttpCode(200)
  @ApiCookieAuth('refresh')
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({ type: SessionDto })
  @ApiOperation({
    summary:
      'Ротация refresh; дубль в коротком окне даёт 409, поздний replay отзывает семью',
    description:
      '60/token и 180/IP за 15 мин. Непосредственный дубль в течение 5 секунд: 409 без cookies и отзыва семьи. После окна replay отзывает семью.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const session = await this.auth.refresh(
        req.cookies?.platform_refresh,
        req.get('x-csrf-token'),
        req.ip,
      );
      this.cookies.set(res, session);
      return session.body;
    } catch (error) {
      if (error instanceof UnauthorizedException) this.cookies.clear(res);
      throw error;
    }
  }

  @UseGuards(AuthOriginGuard, AuthCsrfGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiOkResponse({ type: MessageDto })
  @Post(routes.auth.logout)
  @HttpCode(200)
  async logout(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(
      req.user.id,
      req.user.sessionId,
      false,
    );
    this.cookies.clear(res);
    return result;
  }

  @UseGuards(AuthOriginGuard, AuthCsrfGuard)
  @ApiBearerAuth()
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @ApiOkResponse({ type: MessageDto })
  @Post(routes.auth.logoutAll)
  @HttpCode(200)
  async logoutAll(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    const result = await this.auth.logout(
      req.user.id,
      req.user.sessionId,
      true,
    );
    this.cookies.clear(res);
    return result;
  }

  @ApiBearerAuth()
  @Get(routes.user.profile.me)
  @ApiOkResponse({ type: ProfileDto })
  async me(@Req() req: any) {
    return (
      await this.queries.execute(new GetOwnProfileQuery(req.user.id))
    ).unwrap();
  }

  @Public()
  @UseGuards(AuthOriginGuard)
  @ApiCookieAuth('refresh')
  @Get(routes.auth.csrf)
  @ApiOkResponse({
    schema: { type: 'object', properties: { csrfToken: { type: 'string' } } },
  })
  csrf(@Req() req: any, @Res({ passthrough: true }) res: Response) {
    res.setHeader('Cache-Control', 'no-store');
    return this.auth.csrf(
      req.cookies?.platform_refresh,
      req.cookies?.[CSRF_COOKIE],
      req.ip,
    );
  }
}
