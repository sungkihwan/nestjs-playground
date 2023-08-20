import { Injectable } from '@nestjs/common';
import { SpreadsheetService } from '@libs/spreadsheet';
import { PackingDTO } from './app.controller';
import axios from 'axios';
import { reduce } from 'rxjs';

interface KeyData {
  [key: string]: any;
}

interface BoxVolumes {
  [key: string]: {
    reducedVolume: number;
  };
}

export class ItemDTO {
  name: string;
  size: number[];
}

const BoxSize = {
  3: [440, 300, 220],
  4: [480, 380, 340],
};

@Injectable()
export class AppService {
  private barcodeData;

  private boxVolume;

  constructor(private readonly spreadsheetService: SpreadsheetService) {
    this.boxVolume = {
      3: {
        reducedVolume: Math.round(
          BoxSize['3'].reduce(
            (volume: number, value: number, index: number) => {
              if (volume == 0) {
                volume = value;
              } else {
                if (index == 2) {
                  volume *= value * 0.7;
                } else {
                  volume *= value;
                }
              }
              return volume;
            },
            0,
          ),
        ),
        default: BoxSize['3'].reduce((volume: number, value: number) => {
          if (volume == 0) {
            volume = value;
          } else {
            volume *= value;
          }
          return volume;
        }, 0),
      },
      4: {
        reducedVolume: Math.round(
          BoxSize['4'].reduce(
            (volume: number, value: number, index: number) => {
              if (volume == 0) {
                volume = value;
              } else {
                if (index == 2) {
                  volume *= value * 0.7;
                } else {
                  volume *= value;
                }
              }
              return volume;
            },
            0,
          ),
        ),
        default: BoxSize['4'].reduce((volume: number, value: number) => {
          if (volume == 0) {
            volume = value;
          } else {
            volume *= value;
          }
          return volume;
        }, 0),
      },
    };
    this.initBarcodeData();
  }

  private async initBarcodeData() {
    const spreadsheetMetaData =
      await this.spreadsheetService.getValuesByMultiEditor(
        '1NOPWJzOQNcTAzcxT51Y3G9tsYi5aCkDO_QiYNCEG-aY',
        'Details (KOR)!A3:P122',
      );

    const transformed = this.transformByPack(spreadsheetMetaData);
    this.barcodeData = this.transformByBarcode(transformed);
  }

  public async getAggregatedAmount(): Promise<any> {
    const result = await this.spreadsheetService.getValuesByMultiEditor(
      '1KK36IHmo5vKZBQ72ZA_hAW_9mgpjrkzzwvnjTvdZ-jE',
      '시트1!A1:W1000',
    );
    const transformedData = this.transform(result);

    return this.aggregatedByField(transformedData, 'CNEE', 'AMOUNT');
  }

  public async getSummary() {
    const result = await this.spreadsheetService.getValuesByMultiEditor(
      '1MOYclsTeJX403reBtov-2VYjE68hre7hpl8euy13hxE',
      'Summary!B3:Q60',
    );

    return result;
  }

  public async pakking(packingData: PackingDTO) {
    if (!this.barcodeData) await this.initBarcodeData();

    // 1. 각 제품의 1carton별로 패킹
    const remainingItems = [];
    const cartonPackingResult = {};
    let totalVolume = 0;
    let totalWeight = 0;
    for (const barcode in packingData) {
      const cartonSize = parseInt(this.barcodeData[barcode]['1carton']);
      const totalItemCount = packingData[barcode];

      const cartonCount = Math.floor(totalItemCount / cartonSize);
      const remainingItemCount = totalItemCount % cartonSize;
      const weight =
        cartonCount * parseInt(this.barcodeData[barcode]['weight']);
      const volume = this.barcodeData[barcode]['Carton size'].reduce(
        (volume: number, value: number) => {
          if (volume == 0) {
            volume = value;
          } else {
            volume *= value;
          }
          return volume;
        },
        0,
      );

      cartonPackingResult[barcode] = {
        cartonCount,
        weight,
        volume,
      };

      totalWeight += weight;
      totalVolume += volume;

      if (remainingItemCount > 0) {
        remainingItems.push({
          name: barcode,
          size: this.barcodeData[barcode]['product box'],
          count: remainingItemCount,
          weight: this.barcodeData[barcode]['GW'],
        });
      }
    }

    let remainingTotalVolume = 0;
    let remainingTotalWeight = 0;
    remainingItems.forEach((item) => {
      remainingTotalVolume +=
        item.size.reduce((volume: number, value: number) => {
          if (volume == 0) {
            volume = value;
          } else {
            volume *= value;
          }
          return volume;
        }, 0) * item.count;

      remainingTotalWeight += item.weight * item.count;
    });

    const boxes = this.calculateBoxesDistribution(remainingTotalVolume);

    totalWeight += remainingTotalWeight;
    totalWeight += boxes['box3'] * 1000;
    totalWeight += boxes['box4'] * 1500;
    totalVolume += boxes['box3'] * this.boxVolume['3'].default;
    totalVolume += boxes['box4'] * this.boxVolume['4'].default;

    // const result = await axios.post(
    //   'http://localhost:8000/pack',
    //   remainingItems,
    // );
    //
    // console.log(result.data);

    return {
      cartonPackingResult,
      totalVolume,
      totalWeight,
      remainingBox: {
        box3: boxes['box3'],
        box4: boxes['box4'],
      },
      // packedData: result.data,
    };
  }

  private transformByPack(data: string[][]): KeyData[] {
    const header = data[0];
    const rows = data.slice(1);

    return rows.map((row) => {
      return row.reduce((obj: KeyData, value: string, index: number) => {
        const curHead = header[index];
        obj[curHead] = value;
        return obj;
      }, {});
    });
  }

  private transformByBarcode(data: any[]): { [key: string]: any } {
    const transformedData: { [key: string]: any } = {};
    data.forEach((item) => {
      const barcode = item.Barcode;
      transformedData[barcode] = {
        '1carton': item['1carton\n(ea)'],
        'product size': item['product size\n(ea/cm)']
          ?.split('*')
          ?.map((val: string) => parseFloat(val) * 10), // cm -> mm
        'product box': item['product box \nsize (ea/cm)']
          ?.split('*')
          ?.map((val: string) => parseFloat(val) * 10), // cm -> mm
        GW: item['GW\n(ea/g)'],
        weight:
          (parseFloat(item['weight\n(carton/kg)']) * 1000).toString() || '', // kg -> g
        'Carton size': item['Carton size\n(mm)']
          ?.split('*')
          ?.map((val: string) => parseFloat(val)),
      };

      if (barcode == '8809576261110') {
        transformedData[barcode].weight = 10540;
      }
    });

    return transformedData;
  }

  private packItemsWithRemainingSpace(
    items: ItemDTO[],
    itemCounts: number[],
  ): any {
    const packedBoxes = [];
    const selectedBoxSize = this.selectBoxSize(items, itemCounts);

    // 제품을 크기별로 정렬
    const sortedItems = items.slice().sort((a, b) => {
      const volumeA = a.size.reduce((acc, val) => acc * val, 1);
      const volumeB = b.size.reduce((acc, val) => acc * val, 1);
      return volumeB - volumeA;
    });

    while (itemCounts.some((count) => count > 0)) {
      const remainingBoxSize = [...selectedBoxSize];
      const boxContent = {};
      sortedItems.forEach((item) => (boxContent[item.name] = 0));

      for (let i = 0; i < sortedItems.length; i++) {
        while (
          itemCounts[i] > 0 &&
          sortedItems[i].size.every((s, idx) => remainingBoxSize[idx] >= s)
        ) {
          const possibleCount = sortedItems[i].size.map((s, idx) =>
            Math.floor(remainingBoxSize[idx] / s),
          );
          const maxCount = Math.min(...possibleCount, itemCounts[i]);

          sortedItems[i].size.forEach(
            (s, idx) => (remainingBoxSize[idx] -= s * maxCount),
          );
          itemCounts[i] -= maxCount;
          boxContent[sortedItems[i].name] += maxCount;
        }
      }

      packedBoxes.push({
        items: boxContent,
        remaining_space: remainingBoxSize,
      });
    }

    return packedBoxes;
  }

  private selectBoxSize(items: ItemDTO[], itemCounts: number[]): number[] {
    const totalVolumeForItems = items.reduce((acc, item, index) => {
      const itemVolume = item.size.reduce((a, b) => a * b, 1);
      return acc + itemVolume * itemCounts[index];
    }, 0);

    const box3Volume = BoxSize[3].reduce((a, b) => a * b, 1);
    const box4Volume = BoxSize[4].reduce((a, b) => a * b, 1);

    return totalVolumeForItems <= box3Volume ||
      box4Volume - totalVolumeForItems > box3Volume
      ? BoxSize[3]
      : BoxSize[4];
  }

  private transform(data: string[][]): KeyData[] {
    const header = data[0];
    const rows = data.slice(1);

    return rows.map((row) => {
      return row.reduce((obj: KeyData, value: string, index: number) => {
        const curHead = header[index];

        // if (curHead == 'Barcode') {
        //   obj[curHead] = value;
        // }
        //
        // if (
        //   curHead == '1carton\\n(ea)' ||
        //   curHead == 'product size\\n(ea/cm)' ||
        //   curHead == 'weight\\n(carton/kg)' ||
        //   curHead == 'Carton size\\n(mm)'
        // ) {
        //   curHead = curHead.split('\\n')[0]
        //   console.log(curHead)
        // }

        // if (curHead == 'AMOUNT') {
        //   obj[curHead] = parseFloat(value.replace(/[$,]/g, ''));
        // } else {
        //   obj[curHead] = value;
        // }

        if (curHead == 'AMOUNT') {
          obj[curHead] = parseFloat(value.replace(/[$,]/g, ''));
        } else {
          obj[curHead] = value;
        }
        return obj;
      }, {});
    });
  }

  private aggregatedByField(data: KeyData[], source: string, target: string) {
    const result = {};
    data.forEach((row) => {
      const curHead = row[source].trim().toLowerCase();

      if (!isNaN(row[target])) {
        if (result[curHead]) {
          result[curHead] += row[target];
        } else {
          result[curHead] = row[target];
        }
      }
    });

    return result;
    // const formattedValue = numberValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  }

  public getPackingData(barcode: string) {
    return this.barcodeData[barcode];
  }

  public getPackingDataList() {
    return this.barcodeData;
  }

  calculateBoxesDistribution(remainingTotalVolume: number) {
    const box3Volume = this.boxVolume['3'].reducedVolume;
    const box4Volume = this.boxVolume['4'].reducedVolume;

    let box3Count = 0;
    let box4Count = 0;

    while (remainingTotalVolume > 0) {
      if (remainingTotalVolume <= box3Volume) {
        box3Count += 1;
        remainingTotalVolume = 0;
      } else {
        remainingTotalVolume -= box4Volume;
        box4Count += 1;
      }
    }

    return { box3: box3Count, box4: box4Count };
  }
}
