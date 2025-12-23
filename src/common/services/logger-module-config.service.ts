import { RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModuleAsyncParams } from 'nestjs-pino/params';
import pino from 'pino';
import { EnvironmentTypes } from '../config';

export const LoggerModuleConfigService: LoggerModuleAsyncParams = {
  useFactory: async (config: ConfigService) => {
    const env: EnvironmentTypes = config.get('app.env');

    return {
      pinoHttp: {
        autoLogging: false,
        level: env !== 'production' ? 'debug' : 'info',
        logger: pino({
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              singleLine: true,
              translateTime: 'dd.mm.yyyy, hh:MM:ss',
            },
          },
          level: env !== 'production' ? 'debug' : 'info',
        }),
      },
      exclude: [{ method: RequestMethod.ALL, path: '/' }],
    };
  },
  inject: [ConfigService],
};
