import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { FieldSet } from 'airtable/lib/field_set';
import { SortParameter } from 'airtable/lib/query_params';
import { AirtableService } from '@libs/airtable';
import { AIRTABLE_CONFIG } from '@libs/airtable/constants';

export class PackingDTO {
  [barcode: string]: number;
}

export class GetPackingData {
  barcode: string;
}

@Controller()
export class AppController {
  private readonly exampleAirtable = new AirtableService(
    AIRTABLE_CONFIG.example,
  );
  constructor(private readonly appService: AppService) {}

  @Get('/aggregated-amount')
  async getAggregatedAmount(): Promise<any> {
    return await this.appService.getAggregatedAmount();
  }

  @Get('/summary')
  async getSummary(): Promise<any> {
    return await this.appService.getSummary();
  }

  @Post('/packing')
  public async packing(@Body() packingData: PackingDTO) {
    // const testData = {
    //   '8809576261226': 300,
    //   '8809576261110': 70,
    //   '8809576261219': 210,
    //   '8809576261127': 79,
    //   '8809576261196': 350,
    // };

    return await this.appService.pakking(packingData);
  }

  @Get('/packing')
  public async getPackingData(@Query('barcode') barcode: string) {
    return await this.appService.getPackingData(barcode);
  }

  @Get('/packing-list')
  public async getPackingList() {
    return await this.appService.getPackingDataList();
  }

  @Get('/airtable/test')
  public async airtableTest() {
    const now = new Date();
    const oneHoursAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);

    const where = {
      Created_Time: { $lte: oneHoursAgo, $gte: sixHoursAgo },
      key: '111',
      $or: {
        status: {
          $or: ['test1', 'test2', 'test3'],
        },
        testValue: {
          $or: ['eee', 'ggg', 'aaa'],
        },
      },
    };

    const options = {
      maxRecords: 500,
      sort: [
        { field: 'Created_Time', direction: 'desc' },
      ] as SortParameter<FieldSet>[],
    };

    const records = await this.exampleAirtable.findForSchedulingJob(
      where,
      options,
    );
  }
}
