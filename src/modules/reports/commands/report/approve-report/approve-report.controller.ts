import { Controller, Param, ParseUUIDPipe, Patch } from '@nestjs/common';
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
import { ApproveReportCommand } from './approve-report.command';
import { ReportResponseDto } from '@modules/reports/dtos';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class ApproveReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.approve)
  async approveReport(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportResponseDto> {
    const command = new ApproveReportCommand({ payload: { id } });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
