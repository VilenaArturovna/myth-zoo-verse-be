import { json, urlencoded } from 'express';
import { AuthRateLimitService } from '@modules/auth/auth-rate-limit.service';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser = require('cookie-parser');
import { AuthSettings } from './config/auth-configuration';
import { isIP } from 'net';

export function configureHttp(app: INestApplication) {
  const config = app.get(ConfigService);
  const auth = config.get<AuthSettings>('auth');
  const environment = config.get<string>('app.env');
  const deployed = environment === 'production' || environment === 'staging';
  for (const origin of auth.allowedOrigins) {
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      !['http:', 'https:'].includes(url.protocol) ||
      (deployed && url.protocol !== 'https:')
    )
      throw new Error(
        'AUTH_ALLOWED_ORIGINS must contain exact trusted origins (HTTPS in staging/production)',
      );
  }
  const frontend = new URL(auth.frontendUrl);
  if (
    frontend.username ||
    frontend.password ||
    frontend.search ||
    frontend.hash ||
    frontend.pathname !== '/' ||
    (deployed && frontend.protocol !== 'https:')
  )
    throw new Error('FRONTEND_URL must be a trusted origin');
  if ((deployed || auth.cookieSameSite === 'none') && !auth.cookieSecure)
    throw new Error('Secure cookies are required');
  for (const cidr of auth.trustProxy) {
    const [ip, mask, extra] = cidr.split('/');
    const version = isIP(ip);
    if (
      !version ||
      extra ||
      (mask !== undefined &&
        (!/^\d+$/.test(mask) || +mask > (version === 4 ? 32 : 128)))
    )
      throw new Error(
        'TRUST_PROXY_CIDRS must contain explicit IP addresses/CIDRs',
      );
  }
  app
    .getHttpAdapter()
    .getInstance()
    .set('trust proxy', auth.trustProxy.length ? auth.trustProxy : false);
  app.enableCors({
    origin: auth.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  });
  const limits = app.get(AuthRateLimitService);
  // Installed before body parsing and DTO pipes: even malformed JSON/oversized auth requests count.
  app.use(async (req, res, next) => {
    const path = req.path.toLowerCase().replace(/\/+$/, '');
    if (
      ['POST', 'PATCH'].includes(req.method) &&
      (path.startsWith('/auth/') || path === '/user/login-via-tg')
    ) {
      res.setHeader('Cache-Control', 'no-store');
      const telegram = auth.telegram;
      const stage =
        path === '/auth/telegram/start'
          ? 'start'
          : path === '/auth/telegram/complete'
            ? 'complete'
            : 'auth';
      const max =
        stage === 'start'
          ? telegram.earlyStartLimit
          : stage === 'complete'
            ? telegram.earlyCompleteLimit
            : telegram.earlyAuthLimit;
      try {
        await limits.bucket(
          `auth:early:${stage}:${req.ip}`,
          max,
          auth.limitWindowSeconds,
        );
      } catch (error) {
        const status =
          typeof error.getStatus === 'function' ? error.getStatus() : 503;
        return res.status(status).json({
          statusCode: status,
          code: status === 429 ? 'AUTH_RATE_LIMITED' : 'AUTH_UNAVAILABLE',
        });
      }
    }
    next();
  });
  const authJson = json({ limit: '16kb' }),
    defaultJson = json({ limit: '100kb' });
  const authForm = urlencoded({ extended: false, limit: '16kb' }),
    defaultForm = urlencoded({ extended: false, limit: '100kb' });
  app.use((req, res, next) =>
    (req.path.toLowerCase().startsWith('/auth/') ? authJson : defaultJson)(
      req,
      res,
      next,
    ),
  );
  app.use((req, res, next) =>
    (req.path.toLowerCase().startsWith('/auth/') ? authForm : defaultForm)(
      req,
      res,
      next,
    ),
  );
  // Parser errors can carry raw request bodies in their message/body fields.
  // Handle them before Nest logging/filters and never echo those fields.
  app.use((error, _req, res, next) => {
    if (
      [
        'entity.parse.failed',
        'entity.too.large',
        'encoding.unsupported',
        'charset.unsupported',
        'request.aborted',
      ].includes(error?.type)
    ) {
      const status = [400, 413, 415].includes(error.status)
        ? error.status
        : 400;
      return res
        .status(status)
        .json({ statusCode: status, code: 'INVALID_REQUEST_BODY' });
    }
    next(error);
  });
  app.use(cookieParser());
  app.use((req, res, next) => {
    if (
      req.path.startsWith('/auth/') ||
      req.path === '/user/login-via-tg' ||
      req.path === '/me'
    ) {
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Referrer-Policy', 'no-referrer');
    }
    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      validationError: { target: false, value: false },
    }),
  );
}
