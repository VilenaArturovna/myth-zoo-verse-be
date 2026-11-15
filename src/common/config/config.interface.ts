import { AuthSettings } from './auth-configuration';

export type EnvironmentTypes =
  | 'development'
  | 'staging'
  | 'production'
  | 'test';

export interface Config {
  auth: AuthSettings;
  app: {
    env: EnvironmentTypes;
    port: number;
  };
  database: {
    postgres: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
    redis: {
      host: string;
      port: number;
    };
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessTtl: number;
    refreshTtl: number;
    cookieSecure: boolean;
  };
  telegram: {
    name: string;
    token: string;
  };
}
