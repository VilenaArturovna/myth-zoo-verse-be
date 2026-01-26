import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { Result } from '@libs/utils';
import { routes } from '@libs/routes';
import { ExceptionBase } from '@libs/base-classes';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { GetUserQuery } from '@modules/users/queries';
import { GetUserDaoModel } from '@modules/users/database/read-model';
import { GetUserRequestDto } from './get-user.request.dto';

@ApiTags('users/user')
@Controller()
export class GetUserController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user' })
  @ApiOkResponse({ type: () => GetUserDaoModel })
  @ApiExtraModels(GetUserDaoModel, GetUserRequestDto)
  @Get(routes.user.profile.byId)
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetUserDaoModel> {
    const query = new GetUserQuery({ params: { id } });

    const result: Result<GetUserDaoModel, ExceptionBase> =
      await this.queryBus.execute(query);

    return result.unwrap();
  }
}
