import { Body, Controller, Patch } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { routes } from '@libs/routes';
import { Result } from '@libs/utils';
import { ExceptionBase } from '@libs/base-classes';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { DisableWordCommand } from './disable-word.command';
import { DisableWordRequestDto } from './disable-word.request.dto';
import { CodeWordResponseDto } from '@modules/reports/dtos';
import { CodeWordEntity } from '@modules/reports/domain';

@ApiTags('reports/code-word')
@Controller()
export class DisableWordController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable word' })
  @ApiOkResponse({ type: () => CodeWordResponseDto })
  @Patch(routes.codeWords.disable)
  async disableWord(
    @Body() body: DisableWordRequestDto,
  ): Promise<CodeWordResponseDto> {
    const command = new DisableWordCommand({ payload: body });

    const result: Result<CodeWordEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result
      .mapValue((entity) => new CodeWordResponseDto(entity))
      .unwrap();
  }
}
