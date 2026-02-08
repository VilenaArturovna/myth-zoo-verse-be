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
import { SkipReportCommand } from './skip-report.command';
import { ReportResponseDto } from '@modules/reports/dtos';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class SkipReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Skip report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.skip)
  async skipReport(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ReportResponseDto> {
    const command = new SkipReportCommand({ payload: { id } });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
