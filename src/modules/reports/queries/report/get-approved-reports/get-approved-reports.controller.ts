import { Controller, Get, Query } from '@nestjs/common';
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
import { GetApprovedReportsQuery } from '@modules/reports/queries';
import { GetApprovedReportsDaoModel } from '@modules/reports/database/read-model';
import { GetApprovedReportsRequestDto } from './get-approved-reports.request.dto';

@ApiTags('reports/report')
@Controller()
export class GetApprovedReportsController {
  constructor(private readonly queryBus: QueryBus) {}

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get approved reports' })
  @ApiOkResponse({ type: () => GetApprovedReportsDaoModel })
  @ApiExtraModels(GetApprovedReportsDaoModel, GetApprovedReportsRequestDto)
  @Get(routes.reports.root)
  async getApprovedReports(
    @Query() params: GetApprovedReportsRequestDto,
  ): Promise<GetApprovedReportsDaoModel> {
    const query = new GetApprovedReportsQuery({ params });

    const result: Result<GetApprovedReportsDaoModel, ExceptionBase> =
      await this.queryBus.execute(query);

    return result.unwrap();
  }
}
