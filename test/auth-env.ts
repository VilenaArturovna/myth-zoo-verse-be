// Fail closed: never infer a test connection from the application's .env.
const connection = process.env.AUTH_TEST_DATABASE_URL;
if (!connection)
  throw new Error(
    'Set AUTH_TEST_DATABASE_URL to a disposable loopback PostgreSQL database named auth_test',
  );
const url = new URL(connection);
if (
  !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
  url.pathname !== '/auth_test'
) {
  throw new Error('Auth tests require a loopback database named auth_test');
}
Object.assign(process.env, {
  NODE_ENV: 'test',
  PORT: '0',
  POSTGRES_HOST: url.hostname,
  POSTGRES_PORT: url.port || '5432',
  POSTGRES_USER: decodeURIComponent(url.username),
  POSTGRES_PASSWORD: decodeURIComponent(url.password),
  POSTGRES_DB: 'auth_test',
  REDIS_HOST: 'localhost',
  REDIS_PORT: '6379',
  TELEGRAM_CLIENT_ID: '12345678',
  AUTH_REFRESH_DUPLICATE_SECONDS: '5',
  TG_BOT_TOKEN: 'test-telegram-token',
  TG_BOT_NAME: 'test_bot',
  JWT_ACCESS_SECRET: 'local-test-only-access-secret-32-characters',
  JWT_REFRESH_SECRET: 'unused-test-secret',
  JWT_ACCESS_TTL: '15',
  JWT_REFRESH_TTL: '30',
  COOKIE_SECURE: 'false',
  AUTH_COOKIE_SAME_SITE: 'lax',
  FRONTEND_URL: 'http://localhost:5173',
  AUTH_ALLOWED_ORIGINS: 'http://localhost:5173',
  TRUST_PROXY_CIDRS: '',
  AUTH_ACCESS_SECONDS: '900',
  AUTH_SESSION_SECONDS: '2592000',
  AUTH_VERIFY_SECONDS: '86400',
  AUTH_RESET_SECONDS: '1800',
  AUTH_LIMIT_REGISTER: '100',
  AUTH_LIMIT_LOGIN: '100',
  AUTH_LIMIT_RESEND: '100',
  AUTH_LIMIT_FORGOT: '100',
  AUTH_LIMIT_REFRESH: '100',
  AUTH_LIMIT_TOKEN: '100',
  AUTH_LIMIT_TELEGRAM: '100',
  AUTH_MAIL_COOLDOWN_SECONDS: '60',
  AUTH_EARLY_IP_LIMIT: '10000',
  TELEGRAM_START_IP_LIMIT: '10000',
  TELEGRAM_COMPLETE_IP_LIMIT: '10000',
});
