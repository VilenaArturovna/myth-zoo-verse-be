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
import { UsersModule } from '@modules/users/users.module';
import { AuthModule } from '@modules/auth/auth.module';
import { ReportsModule } from '@modules/reports/reports.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '@modules/auth/guards/jwt-auth.guard';
import { WorldModule } from '@modules/world/world.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'test',
      load: [configuration],
      validationSchema: validationSchema,
      validationOptions: validationOptions,
    }),
    LoggerModule.forRootAsync(LoggerModuleConfigService),
    UsersModule,
    AuthModule,
    ReportsModule,
    WorldModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    ObjectionConfigService,
  ],
})
export class AppModule {}
