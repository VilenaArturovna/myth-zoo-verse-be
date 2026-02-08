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
import { SendToReviewReportCommand } from './send-to-review-report.command';
import { SendToReviewReportRequestDto } from './send-to-review-report.request.dto';
import { ReportResponseDto } from '@modules/reports/dtos';
import { ReportEntity } from '@modules/reports/domain';
import { MyId } from '@src/common';

@ApiTags('reports/report')
@Controller()
export class SendToReviewReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send to review report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Patch(routes.reports.sendToReview)
  async sendToReviewReport(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: SendToReviewReportRequestDto,
    @MyId() userId: string,
  ): Promise<ReportResponseDto> {
    const command = new SendToReviewReportCommand({
      payload: { ...body, id, userId },
    });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
