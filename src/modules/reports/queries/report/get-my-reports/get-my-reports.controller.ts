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
import { GetMyReportsQuery } from '@modules/reports/queries';
import { GetMyReportsDaoModel } from '@modules/reports/database/read-model';
import { MyId } from '@src/common';

@ApiTags('reports/report')
@Controller()
export class GetMyReportsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get my reports' })
  @ApiOkResponse({ type: () => GetMyReportsDaoModel, isArray: true })
  @ApiExtraModels(GetMyReportsDaoModel)
  @Get(routes.reports.my)
  async getMyReports(@MyId() userId: string): Promise<GetMyReportsDaoModel[]> {
    const query = new GetMyReportsQuery({ params: { userId } });

    const result: Result<GetMyReportsDaoModel[], ExceptionBase> =
      await this.queryBus.execute(query);

    return result.unwrap();
  }
}
