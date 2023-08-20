import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

export class PackingDTO {
  [barcode: string]: number;
}

export class GetPackingData {
  barcode: string;
}

@Controller()
export class AppController {
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
}
