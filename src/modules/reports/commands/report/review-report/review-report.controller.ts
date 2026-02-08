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
import { ReviewReportCommand } from './review-report.command';
import { ReportResponseDto } from '@modules/reports/dtos';
import { MyId } from '@src/common';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class ReviewReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Review report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.review)
  async reviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @MyId() reviewerId: string,
  ): Promise<ReportResponseDto> {
    const command = new ReviewReportCommand({ payload: { id, reviewerId } });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
