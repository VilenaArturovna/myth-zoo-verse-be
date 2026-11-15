import * as Joi from 'joi';

export const validationSchema = Joi.object({
  FRONTEND_URL: Joi.string()
    .uri({ scheme: ['https', 'http'] })
    .default('http://localhost:5173'),
  AUTH_ALLOWED_ORIGINS: Joi.string().default('http://localhost:5173'),
  TRUST_PROXY_CIDRS: Joi.string().allow('').default(''),
  AUTH_COOKIE_SAME_SITE: Joi.string()
    .valid('strict', 'lax', 'none')
    .default('lax'),
  AUTH_ACCESS_SECONDS: Joi.number().integer().min(60).max(3600).default(900),
  AUTH_SESSION_SECONDS: Joi.number()
    .integer()
    .min(300)
    .max(7776000)
    .default(2592000),
  AUTH_VERIFY_SECONDS: Joi.number()
    .integer()
    .min(60)
    .max(604800)
    .default(86400),
  AUTH_RESET_SECONDS: Joi.number().integer().min(60).max(86400).default(1800),
  AUTH_REFRESH_DUPLICATE_SECONDS: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(5),
  TELEGRAM_CLIENT_ID: Joi.string()
    .pattern(/^[1-9][0-9]{0,15}$/)
    .custom((value, helpers) =>
      Number.isSafeInteger(Number(value))
        ? value
        : helpers.error('any.invalid'),
    )
    .required(),
  TELEGRAM_JWKS_URL: Joi.string()
    .uri({ scheme: ['https', 'http'] })
    .default('https://oauth.telegram.org/.well-known/jwks.json'),
  TELEGRAM_ATTEMPT_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(600)
    .default(300),
  TELEGRAM_TOKEN_MAX_AGE_SECONDS: Joi.number()
    .integer()
    .min(30)
    .max(600)
    .default(300),
  TELEGRAM_JWKS_TIMEOUT_MS: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(2000),
  TELEGRAM_JWKS_COOLDOWN_MS: Joi.number()
    .integer()
    .min(50)
    .max(60000)
    .default(30000),
  TELEGRAM_JWKS_CACHE_MS: Joi.number()
    .integer()
    .min(100)
    .max(3600000)
    .default(600000),
  TELEGRAM_JWKS_REQUESTS_PER_MINUTE: Joi.number()
    .integer()
    .min(1)
    .max(60)
    .default(10),
  TELEGRAM_START_IP_LIMIT: Joi.number().integer().min(1).default(20),
  TELEGRAM_COMPLETE_IP_LIMIT: Joi.number().integer().min(1).default(60),
  AUTH_EARLY_IP_LIMIT: Joi.number().integer().min(1).default(180),
  AUTH_LIMIT_WINDOW_SECONDS: Joi.number().integer().min(1).default(900),
  AUTH_MAIL_COOLDOWN_SECONDS: Joi.number().integer().min(1).default(60),
  ...Object.fromEntries(
    [
      'REGISTER',
      'LOGIN',
      'RESEND',
      'FORGOT',
      'REFRESH',
      'TOKEN',
      'TELEGRAM',
    ].map((name) => [`AUTH_LIMIT_${name}`, Joi.number().integer().min(1)]),
  ),
  SMTP_HOST: Joi.string().hostname().default('postbox.cloud.yandex.net'),
  SMTP_PORT: Joi.number().valid(587).default(587),
  SMTP_USER: Joi.string().when('NODE_ENV', {
    is: Joi.valid('production', 'staging'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_PASSWORD: Joi.string().when('NODE_ENV', {
    is: Joi.valid('production', 'staging'),
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
  SMTP_FROM_ADDRESS: Joi.string().email().default('noreply@example.com'),
  SMTP_FROM_NAME: Joi.string().max(100).default('Игры для вышивальщиц'),
  //APP
  NODE_ENV: Joi.string().valid('development', 'staging', 'production', 'test'),
  PORT: Joi.number().port(),

  //POSTGRES
  POSTGRES_HOST: Joi.string().required(),
  POSTGRES_PORT: Joi.number().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),

  //REDIS
  REDIS_HOST: Joi.string().required(),
  REDIS_PORT: Joi.number().required(),

  //TELEGRAM
  TG_BOT_TOKEN: Joi.string().allow('').optional(),
  TG_BOT_NAME: Joi.string().allow('').optional(),

  //JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_ACCESS_TTL: Joi.number().required(),
  JWT_REFRESH_TTL: Joi.number().required(),
  COOKIE_SECURE: Joi.boolean().required(),
});
