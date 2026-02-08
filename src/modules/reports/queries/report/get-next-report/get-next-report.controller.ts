import { Controller, Get } from '@nestjs/common';
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
import { GetNextReportQuery } from '@modules/reports/queries';
import { GetNextReportDaoModel } from '@modules/reports/database/read-model';
import { MyId } from '@src/common';

@ApiTags('reports/report')
@Controller()
export class GetNextReportController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get next report' })
  @ApiOkResponse({ type: () => GetNextReportDaoModel })
  @ApiExtraModels(GetNextReportDaoModel)
  @Get(routes.reports.next)
  async getNextReport(
    @MyId() reviewerId: string,
  ): Promise<GetNextReportDaoModel> {
    const query = new GetNextReportQuery({ params: { reviewerId } });

    const result: Result<GetNextReportDaoModel, ExceptionBase> =
      await this.queryBus.execute(query);

    return result.unwrap();
  }
}
