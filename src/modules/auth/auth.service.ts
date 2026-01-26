import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    // TODO: твой UsersService/репозиторий (Objection)
    // private users: UsersService,
  ) {}

  // ====== публичные методы ======

  async login(email: string, password: string, res: Response) {
    //const user = await this.findUserByEmail(email); // TODO
    //if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await argon2.verify('user.passwordHash', password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { accessToken, refreshToken } = await this.issueTokens(
      'user.id',
      'user.email',
    );

    await this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenHash('user.id', refreshToken); // TODO (в БД!)

    return { accessToken };
  }

  async refresh(userId: string, res: Response) {
    // ВАРИАНТ 1 (минимум): только новый access
    // ВАРИАНТ 2 (лучше): ротация refresh (выдать новый refresh и перезаписать cookie + хеш в БД)
    //const user = await this.findUserById(userId); // TODO
    //if (!user) throw new UnauthorizedException();

    const { accessToken, refreshToken } = await this.issueTokens(
      'user.id',
      'user.email',
    );

    await this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenHash('sdf', refreshToken);

    return { accessToken };
  }

  async logout(userId: string, res: Response) {
    await this.clearRefreshToken(userId); // TODO: удалить/обнулить refreshTokenHash в БД
    this.clearRefreshTokenCookie(res);
    return { ok: true };
  }

  // ====== токены ======

  private async issueTokens(userId: string, email: string) {
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');

    const accessTtl = this.config.get<number>('JWT_ACCESS_TTL') ?? '15m';
    const refreshTtl = this.config.get<number>('JWT_REFRESH_TTL') ?? '30d';

    const accessToken = await this.jwt.signAsync(
      { sub: userId, email },
      { secret: accessSecret, expiresIn: accessTtl },
    );

    const refreshToken = await this.jwt.signAsync(
      { sub: userId },
      { secret: refreshSecret, expiresIn: refreshTtl },
    );

    return { accessToken, refreshToken };
  }

  // ====== cookies ======

  private async setRefreshTokenCookie(res: Response, refreshToken: string) {
    const secure =
      (this.config.get<string>('COOKIE_SECURE') ?? 'false') === 'true';

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure,
      sameSite: 'lax', // на одном домене обычно ок
      path: '/auth/refresh', // cookie будет отправляться только на refresh endpoint
      maxAge: 30 * 24 * 60 * 60 * 1000, // можно синхронизировать с JWT_REFRESH_TTL
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
  }

  // ====== заглушки под твою БД ======

  private async saveRefreshTokenHash(userId: string, token: string) {
    const hash = await argon2.hash(token);
    // TODO: users.update(userId, { refreshTokenHash: hash })
    void hash;
  }

  private async clearRefreshToken(userId: string) {
    // TODO: users.update(userId, { refreshTokenHash: null })
    void userId;
  }
}
