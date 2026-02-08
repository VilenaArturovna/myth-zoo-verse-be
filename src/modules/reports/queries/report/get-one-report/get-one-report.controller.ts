import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
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
import { GetOneReportQuery } from '@modules/reports/queries';
import { GetOneReportDaoModel } from '@modules/reports/database/read-model';

@ApiTags('reports/report')
@Controller()
export class GetOneReportController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get one report' })
  @ApiOkResponse({ type: () => GetOneReportDaoModel })
  @ApiExtraModels(GetOneReportDaoModel)
  @Get(routes.reports.byId)
  async getOneReport(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<GetOneReportDaoModel> {
    const query = new GetOneReportQuery({ params: { id } });

    const result: Result<GetOneReportDaoModel, ExceptionBase> =
      await this.queryBus.execute(query);

    return result.unwrap();
  }
}
