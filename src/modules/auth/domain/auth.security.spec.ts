import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import pino from 'pino';
import {
  AuthMailService,
  MemoryMailTransport,
  PostboxTransport,
} from '../mail/auth-mail.service';
import { authConfiguration } from '@src/common/config/auth-configuration';
import { safeLoggingOptions } from '@src/common/services/safe-logging';
import { exceptionMapper } from '@libs/exceptions/exception.mapper';
import {
  equalSecret,
  hashSecret,
  newSecret,
  normalizeEmail,
} from './auth.security';
import { configureHttp } from '@src/common/configure-http';
import { validationSchema } from '@src/common/config/validation.schema';

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(async () => ({
      accepted: ['test@example.com'],
      rejected: [],
    })),
    close: jest.fn(),
  })),
}));
describe('Auth security and mail', () => {
  it('uses 256-bit opaque secrets and canonicalizes email without provider-specific rewriting', () => {
    const a = newSecret(),
      b = newSecret();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(a).not.toBe(b);
    expect(hashSecret(a)).toHaveLength(64);
    expect(hashSecret(a)).not.toContain(a);
    expect(equalSecret(a, a)).toBe(true);
    expect(equalSecret(a, b)).toBe(false);
    expect(equalSecret(a, '')).toBe(false);
    expect(normalizeEmail(' A.B+flowers@Example.COM ')).toBe(
      'a.b+flowers@example.com',
    );
  });
  it('uses STARTTLS, certificate verification and bounded timeouts without debug logging', async () => {
    const config = new ConfigService({ auth: authConfiguration() });
    const transport = new PostboxTransport(config);
    expect(nodemailer.createTransport as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        requireTLS: true,
        tls: { rejectUnauthorized: true, minVersion: 'TLSv1.2' },
        logger: false,
        debug: false,
      }),
    );
    await transport.send({
      to: 'test@example.com',
      subject: 'Тест',
      text: 'Проверка',
      html: '<p>Проверка</p>',
    });
    const raw = (nodemailer.createTransport as jest.Mock).mock.results.at(
      -1,
    ).value;
    raw.sendMail.mockResolvedValueOnce({
      accepted: [],
      rejected: ['test@example.com'],
    });
    await expect(
      transport.send({
        to: 'test@example.com',
        subject: 'Тест',
        text: 'Проверка',
        html: '<p>Проверка</p>',
      }),
    ).rejects.toThrow('SMTP_NOT_ACCEPTED');
    transport.onModuleDestroy();
  });
  it('renders all Russian templates, keeps tokens in fragments and does not log SMTP errors', async () => {
    const memory = new MemoryMailTransport();
    const service = new AuthMailService(
      new ConfigService({ auth: authConfiguration() }),
      memory,
    );
    const secret = newSecret();
    await service.send('test@example.com', 'verify-email', secret);
    await service.send('test@example.com', 'reset-password', secret);
    await service.send('test@example.com', 'password-changed');
    expect(memory.messages).toHaveLength(3);
    expect(memory.messages[0].text).toContain(
      `/auth/verify-email#token=${secret}`,
    );
    expect(memory.messages[1].html).toContain(
      `/auth/reset-password#token=${secret}`,
    );
    expect(memory.messages[2].text).not.toContain(secret);
    expect(memory.messages.every((m) => m.text && m.html)).toBe(true);
    const warn = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
    const failing = {
      send: async () => {
        throw new Error(`password private ${secret}`);
      },
    };
    expect(
      await new AuthMailService(
        new ConfigService({ auth: authConfiguration() }),
        failing,
      ).send('test@example.com', 'verify-email', secret),
    ).toBe(false);
    expect(JSON.stringify(warn.mock.calls)).not.toMatch(
      new RegExp(secret + '|private|test@example.com'),
    );
    warn.mockRestore();
  });
  it('removes bodies, credentials, cookies and links from structured logs and errors', () => {
    let output = '';
    const logger = pino(safeLoggingOptions, {
      write: (s) => {
        output += s;
      },
    });
    logger.error(
      {
        req: {
          method: 'POST',
          url: '/reset?token=secret-link',
          headers: { authorization: 'secret-bearer', cookie: 'secret-cookie' },
          body: { password: 'secret-password' },
        },
        res: { statusCode: 500, headers: { 'set-cookie': 'secret-cookie' } },
        idToken: 'secret-id-token',
        nonce: 'secret-nonce',
        browserSecret: 'secret-binding',
        token: 'secret-token',
        password: 'secret-password',
        err: new Error('secret-smtp-body'),
      },
      'request_failed',
    );
    expect(output).not.toMatch(/secret-/);
    expect(output).toContain('REDACTED');
    const error = jest.fn();
    expect(() =>
      exceptionMapper(new Error('secret-bindings') as any, {
        error,
        log: jest.fn(),
        warn: jest.fn(),
      }),
    ).toThrow('Внутренняя ошибка сервера');
    expect(JSON.stringify(error.mock.calls)).not.toContain('secret-bindings');
  });
  it('rejects insecure deployed cookies, cross-site insecure cookies and blanket proxy trust', () => {
    const check = (auth: any, env = 'production') => {
      const config = new ConfigService({ auth, app: { env } });
      configureHttp({
        get: () => config,
        getHttpAdapter: () => ({ getInstance: () => ({ set: jest.fn() }) }),
        enableCors: jest.fn(),
        use: jest.fn(),
        useGlobalPipes: jest.fn(),
      } as any);
    };
    const settings = {
      ...authConfiguration(),
      frontendUrl: 'https://app.example.com',
      allowedOrigins: ['https://app.example.com'],
    };
    expect(() => check({ ...settings, cookieSecure: false })).toThrow('Secure');
    expect(() =>
      check({ ...settings, cookieSecure: true, trustProxy: ['true'] }),
    ).toThrow('CIDRs');
    expect(() =>
      check(
        { ...settings, cookieSecure: false, cookieSameSite: 'none' },
        'development',
      ),
    ).toThrow('Secure');
    expect(() =>
      check({ ...settings, cookieSecure: true, trustProxy: ['127.0.0.1/32'] }),
    ).not.toThrow();
    expect(
      validationSchema.extract('SMTP_PORT').validate(465).error,
    ).toBeTruthy();
  });
});
