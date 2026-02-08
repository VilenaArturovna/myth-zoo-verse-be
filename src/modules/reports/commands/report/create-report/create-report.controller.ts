import { Controller, Post } from '@nestjs/common';
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
import { CreateReportCommand } from './create-report.command';
import { MyId } from '@src/common';
import { ReportResponseDto } from '@modules/reports/dtos';
import { ReportEntity } from '@modules/reports/domain';

@ApiTags('reports/report')
@Controller()
export class CreateReportController {
  constructor(private readonly commandBus: CommandBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create report' })
  @ApiOkResponse({ type: () => ReportResponseDto })
  @Post(routes.reports.root)
  async createReport(@MyId() userId: string): Promise<ReportResponseDto> {
    const command = new CreateReportCommand({ payload: { userId } });

    const result: Result<ReportEntity, ExceptionBase> =
      await this.commandBus.execute(command);

    return result.mapValue((entity) => new ReportResponseDto(entity)).unwrap();
  }
}
