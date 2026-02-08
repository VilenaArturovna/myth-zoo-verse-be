import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { commandControllers, commandHandlers } from '@modules/auth/commands';
import { CqrsModule } from '@nestjs/cqrs';
import { UsersModule } from '@modules/users/users.module';
import { JwtConfigService } from '@src/common';

@Module({
  imports: [
    JwtModule.registerAsync({ useClass: JwtConfigService }), // мы будем подписывать токены через JwtService + ConfigService
    CqrsModule,
    UsersModule,
  ],
  controllers: [...commandControllers],
  providers: [JwtAccessStrategy, JwtRefreshStrategy, ...commandHandlers],
  exports: [],
})
export class AuthModule {}
