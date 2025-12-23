import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import {
  configuration,
  LoggerModuleConfigService,
  ObjectionConfigService,
  validationOptions,
  validationSchema,
} from '@src/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validationSchema,
      validationOptions: validationOptions,
    }),
    LoggerModule.forRootAsync(LoggerModuleConfigService),
  ],
  controllers: [AppController],
  providers: [ObjectionConfigService],
})
export class AppModule {}
