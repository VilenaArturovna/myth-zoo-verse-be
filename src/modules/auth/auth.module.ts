import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { commandControllers, commandHandlers } from '@modules/auth/commands';
import { CqrsModule } from '@nestjs/cqrs';
import { UserModule } from '@modules/users/user.module';

@Module({
  imports: [
    JwtModule.register({}), // мы будем подписывать токены через JwtService + ConfigService
    CqrsModule,
    UserModule,
  ],
  controllers: [...commandControllers],
  providers: [JwtAccessStrategy, JwtRefreshStrategy, ...commandHandlers],
  exports: [],
})
export class AuthModule {}
