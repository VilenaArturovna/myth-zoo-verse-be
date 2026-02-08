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
import { UpdateReportCommand } from './update-report.command';
import { UpdateReportRequestDto } from './update-report.request.dto';
import { ReportResponseDto } from '@modules/reports/dtos';
import { MyId } from '@src/common';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class UpdateReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.byId)
  async updateReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateReportRequestDto,
    @MyId() userId: string,
  ): Promise<ReportResponseDto> {
    const command = new UpdateReportCommand({
      payload: { ...body, id, userId },
    });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
