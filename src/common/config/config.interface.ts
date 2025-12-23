export type EnvironmentTypes = 'development' | 'production';

export interface Config {
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
    secret: string;
  };
}
