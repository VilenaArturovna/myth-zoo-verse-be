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
import { RejectReportCommand } from './reject-report.command';
import { RejectReportRequestDto } from './reject-report.request.dto';
import { ReportResponseDto } from '@modules/reports/dtos';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class RejectReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.reject)
  async rejectReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RejectReportRequestDto,
  ): Promise<ReportResponseDto> {
    const command = new RejectReportCommand({ payload: { ...body, id } });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
