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
import { UserModule } from '@modules/users/user.module';
import { AuthModule } from '@modules/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validationSchema,
      validationOptions: validationOptions,
    }),
    LoggerModule.forRootAsync(LoggerModuleConfigService),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [ObjectionConfigService],
})
export class AppModule {}
