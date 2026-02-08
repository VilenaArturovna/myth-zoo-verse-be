import { ExceptionBase } from '@libs/base-classes';
import { CommandHandlerBase } from '@libs/base-classes/command-handler.base';
import { ValidationException } from '@libs/exceptions';
import { checkTelegramHash, Result } from '@libs/utils';
import { HashVO, UrlVO } from '@libs/value-objects';
import { UsersUnitOfWork } from '@modules/users/database/unit-of-work';
import { UserEntity } from '@modules/users/domain';
import { ConfigService } from '@nestjs/config';
import { CommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';

import { LoginViaTgCommand, LoginViaTgResponse } from './login-via-tg.command';
import { EnvironmentTypes } from '@src/common';
import { JwtPayload } from '@modules/auth/strategies/jwt-access.strategy';

@CommandHandler(LoginViaTgCommand)
export class LoginViaTgCommandHandler extends CommandHandlerBase<
  UsersUnitOfWork,
  LoginViaTgResponse
> {
  constructor(
    unitOfWork: UsersUnitOfWork,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    super(unitOfWork);
  }

  async handle(
    command: LoginViaTgCommand,
  ): Promise<Result<LoginViaTgResponse, ExceptionBase>> {
    const {
      payload: { id, photo_url, username },
      trxId,
    } = command;

    const env = this.configService.get<EnvironmentTypes>('app.env');

    if (env === 'production') {
      const telegramToken = this.configService.get<string>('telegram.token');

      const isValidHash = checkTelegramHash(command.payload, telegramToken);
      if (!isValidHash) {
        return Result.fail(
          new ValidationException(
            'Данные приходят не от бота cross_stitch_games',
          ),
        );
      }
    }

    const repository = this.unitOfWork.getUserRepository(trxId);

    const userResult = await repository.getOneByTgId(id.toString());
    let user: UserEntity;

    if (!userResult.isErr) {
      user = userResult.unwrap();
    } else {
      const newUser = UserEntity.create({
        tgId: id.toString(),
        username,
        photoUrl: photo_url ? new UrlVO(photo_url) : undefined,
      });

      const insertResult = await repository.create(newUser);
      user = insertResult.unwrap();
    }

    const jwtPayload: JwtPayload = {
      id: user.id.value,
    };

    const { refreshToken, accessToken } = this.issueTokens(jwtPayload);

    user.setRefreshTokenHash(new HashVO(refreshToken));
    await repository.update(user);

    return Result.ok({ user, accessToken, refreshToken });
  }

  private issueTokens(jwtPayload: JwtPayload) {
    const accessSecret = this.configService.get<string>('jwt.accessSecret');
    const refreshSecret =
      this.configService.getOrThrow<string>('jwt.refreshSecret');

    const accessTtl = this.configService.get<number>('jwt.accessTtl');
    const refreshTtl = this.configService.get<number>('jwt.refreshTtl');

    const accessToken = this.jwtService.sign(jwtPayload, {
      expiresIn: `${accessTtl}Minutes`,
      secret: accessSecret,
    });

    const refreshToken = this.jwtService.sign(jwtPayload, {
      secret: refreshSecret,
      expiresIn: `${refreshTtl}Days`,
    });

    return { accessToken, refreshToken };
  }
}
