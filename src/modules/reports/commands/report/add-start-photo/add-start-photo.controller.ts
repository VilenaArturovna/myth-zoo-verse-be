import { Body, Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
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
import { AddStartPhotoCommand } from './add-start-photo.command';
import { AddStartPhotoRequestDto } from './add-start-photo.request.dto';
import { ReportResponseDto } from '@modules/reports/dtos';
import { MyId } from '@src/common';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class AddStartPhotoController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add start photo' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.addStartPhoto)
  async addStartPhoto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddStartPhotoRequestDto,
    @MyId() userId: string,
  ): Promise<ReportResponseDto> {
    const command = new AddStartPhotoCommand({
      payload: { ...body, id, userId },
    });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
