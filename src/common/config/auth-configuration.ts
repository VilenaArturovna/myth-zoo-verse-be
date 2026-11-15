const number = (name: string, fallback: number) =>
  Number(process.env[name] ?? fallback);
export const authConfiguration = () => ({
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  allowedOrigins: (process.env.AUTH_ALLOWED_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim()),
  trustProxy: (process.env.TRUST_PROXY_CIDRS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  accessSeconds: number('AUTH_ACCESS_SECONDS', 900),
  sessionSeconds: number('AUTH_SESSION_SECONDS', 2592000),
  verifySeconds: number('AUTH_VERIFY_SECONDS', 86400),
  resetSeconds: number('AUTH_RESET_SECONDS', 1800),
  refreshDuplicateSeconds: number('AUTH_REFRESH_DUPLICATE_SECONDS', 5),
  telegram: {
    clientId: process.env.TELEGRAM_CLIENT_ID ?? '',
    jwksUrl:
      process.env.TELEGRAM_JWKS_URL ??
      'https://oauth.telegram.org/.well-known/jwks.json',
    attemptSeconds: number('TELEGRAM_ATTEMPT_SECONDS', 300),
    tokenMaxAgeSeconds: number('TELEGRAM_TOKEN_MAX_AGE_SECONDS', 300),
    jwksTimeoutMs: number('TELEGRAM_JWKS_TIMEOUT_MS', 2000),
    jwksCooldownMs: number('TELEGRAM_JWKS_COOLDOWN_MS', 30000),
    jwksCacheMs: number('TELEGRAM_JWKS_CACHE_MS', 600000),
    jwksRequestsPerMinute: number('TELEGRAM_JWKS_REQUESTS_PER_MINUTE', 10),
    earlyStartLimit: number('TELEGRAM_START_IP_LIMIT', 20),
    earlyCompleteLimit: number('TELEGRAM_COMPLETE_IP_LIMIT', 60),
    earlyAuthLimit: number('AUTH_EARLY_IP_LIMIT', 180),
  },
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  cookieSameSite: (process.env.AUTH_COOKIE_SAME_SITE ?? 'lax') as
    | 'lax'
    | 'strict'
    | 'none',
  limits: {
    register: number('AUTH_LIMIT_REGISTER', 5),
    login: number('AUTH_LIMIT_LOGIN', 10),
    resend: number('AUTH_LIMIT_RESEND', 5),
    forgot: number('AUTH_LIMIT_FORGOT', 5),
    refresh: number('AUTH_LIMIT_REFRESH', 60),
    token: number('AUTH_LIMIT_TOKEN', 10),
    telegram: number('AUTH_LIMIT_TELEGRAM', 10),
  },
  limitWindowSeconds: number('AUTH_LIMIT_WINDOW_SECONDS', 900),
  mailCooldownSeconds: number('AUTH_MAIL_COOLDOWN_SECONDS', 60),
  smtp: {
    host: process.env.SMTP_HOST ?? 'postbox.cloud.yandex.net',
    port: number('SMTP_PORT', 587),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromAddress: process.env.SMTP_FROM_ADDRESS ?? 'noreply@example.com',
    fromName: process.env.SMTP_FROM_NAME ?? 'Игры для вышивальщиц',
  },
});
export type AuthSettings = ReturnType<typeof authConfiguration>;
