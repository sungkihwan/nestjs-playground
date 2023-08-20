import { Test, TestingModule } from '@nestjs/testing';
import { SpreadsheetService } from './spreadsheet.service';

describe('SpreadsheetService', () => {
  let service: SpreadsheetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpreadsheetService],
    }).compile();

    service = module.get<SpreadsheetService>(SpreadsheetService);
  });

  // it.skip('read sheet test', async () => {
  //   const SHEET_READ_RANGE = '1. 법인설립 배정_list!C165:D165';
  //   const res = await service.readSheet(SPREAD_SHEET_ID, SHEET_READ_RANGE);
  // });
  //
  // it.skip('add permision', async () => {
  //   // const CALCULATOR_TEMPLATE_SPREAD_SHEET_ID = '1DjfDx_hu-UAnBUiYDx_6ggr6-yGrWRwjeRg_6cb3ScQ';
  //   // const INFO_TECH_GOOGLE_DRIVE_FOLDER_ID = '1sVulytQKxyXQIfz4dPAqu52Khm3pXWpB';
  //
  //   const CALCULATOR_TEMPLATE_SPREAD_SHEET_ID = '1dFf-ZuCwtgL48T-UuFKEZ8lWEiQn8bVVbHeVv5j9z2E';
  //   const HOMETAX_RAW_TEMPLATE_SPREAD_SHEET_ID = '1t34n4x306pggUvO3y6oTXK6dRessDa4SqsynDCN9u6Y';
  //   const COMWEL_RAW_TEMPLATE_SPREAD_SHEET_ID = '1F6KkPWNP1W83zC0S59jLwVniXsc8s0sxBDWCcYZlbxU';
  //   // const INFO_TECH_GOOGLE_DRIVE_FOLDER_ID = '1ibyQHurG5wcTvo3GOFdEyEUnfRKwYunS';
  //
  //   // const FORDER_CAL = '1TkG9WWbD9mJU_uyq2cQqZ9Mrz6HfjWP2'
  //
  //   const spreadsheetDir = path.join(__dirname, '../../../resource/spreadsheet/');
  //   const emailList = [];
  //   fs.readdirSync(spreadsheetDir).forEach((file) => {
  //     if (path.extname(file) === '.json') {
  //       try {
  //         const data = fs.readFileSync(path.join(spreadsheetDir, file), 'utf8');
  //         const json = JSON.parse(data);
  //         if (json.client_email) {
  //           emailList.push(json.client_email);
  //         }
  //       } catch (err) {
  //         console.error('파일을 읽거나 파싱하는 데 실패했습니다:', err);
  //       }
  //     }
  //   });
  //
  //   const role = 'writer'
  //   const type = 'user'
  //   console.log(emailList.join('\n'))
  //   // for (const email of emailList) {
  //   //   await service.addPermission(CALCULATOR_TEMPLATE_SPREAD_SHEET_ID, email, role, type);
  //   //   await service.addPermission(HOMETAX_RAW_TEMPLATE_SPREAD_SHEET_ID, email, role, type);
  //   //   await service.addPermission(COMWEL_RAW_TEMPLATE_SPREAD_SHEET_ID, email, role, type);
  //   //   // For folders, you should use the related method.
  //   //   // await service.addPermission(INFO_TECH_GOOGLE_DRIVE_FOLDER_ID, email, role, type);
  //   // }
  // })
  //
  // it.skip('read sheet test', async () => {
  //   const SHEET_READ_RANGE = '1. 법인설립 배정_list!C165:D165';
  //   const res = await service.readSheet(SPREAD_SHEET_ID, SHEET_READ_RANGE);
  //   expect(res).toBeArray();
  // });
  //
  // it.skip('create sheet test', async () => {
  //   const SPREAD_SHEET_TITLE = '테스트 스프레드시트22';
  //   const res = await service.createSheet(SPREAD_SHEET_TITLE);
  // });
  //
  // it.skip('copy file and move file', async () => {
  //   const SPREAD_SHEET_ID = '1DjfDx_hu-UAnBUiYDx_6ggr6-yGrWRwjeRg_6cb3ScQ';
  //   const FOLDER_ID = '1sVulytQKxyXQIfz4dPAqu52Khm3pXWpB';
  //   const sheetId = await service.copyFile(SPREAD_SHEET_ID, '테스트 스프레드시트입니다.');
  //   await service.moveFolder(sheetId, FOLDER_ID);
  // }, LONG_TIME);
  //
  // it.skip('test sheet read', async () => {
  //   const SPREAD_SHEET_ID = '1ZAKeKQy7eUsE6Jqxi8N89tbg2Y0L50RXzumtCjE-Ytc';
  //   const VIEW_RANGE = '1-c_신고서!A1:ZZZ1000';
  //   const sheetId = await service.readSheet(SPREAD_SHEET_ID, VIEW_RANGE);
  //   console.log(sheetId);
  //   await service.updateSheet(SPREAD_SHEET_ID, '1-c_신고서의 사본!A1:ZZZ100000', sheetId);
  // });
  //
  // it.skip('test folder read', async () => {
  //   const SPREAD_FOLDER_ID = '0AEKtku4sYvvzUk9PVA';
  //   const folders = await service.readFolder(SPREAD_FOLDER_ID);
  //   console.log(folders);
  //   const sheetIds = folders.map(v => v.id);
  //   // const copy = await service.readSheet(sheetIds[0], '2-1.[기장료]!AC7:AC');
  //   // console.log(copy)
  //   for (const sheetId of sheetIds) {
  //     await service.updateSheet(
  //       sheetId,
  //       '2-1.[기장료]!V8:AC',
  //       _.fill(_.range(200), ['', '', , , , , , '']),
  //       'USER_ENTERED'
  //     );
  //
  //     await service.updateSheet(
  //       sheetId,
  //       '2-1.[기장료]!V7:AC',
  //       [
  //         [
  //           , '=ARRAYFORMULA(IFERROR(VLOOKUP(V7:V300,{\'1.[거래처]\'!J8:J300,\'1.[거래처]\'!E8:E300},2,0)))', , , , , ,
  //           '=ARRAYFORMULA(IF(V7:V300="","",IMPORTRANGE(\'[함수참조]\'!F38,"2-1.[기장료]!R6:R300")))'
  //         ],
  //         ['=IMPORTRANGE(\'[함수참조]\'!F38,"2-1.[기장료]!D7:D300")', ],
  //       ],
  //       'USER_ENTERED'
  //     );
  //     const ranges = [
  //       '1.[거래처]!K8:AJ300',
  //       '1.[거래처]!BI8:BI300',
  //       '2-1.[기장료]!V7:W200',
  //       '2-1.[기장료]!AA7:AC200',
  //       '5-1.[법인_조정료]!AG6:AI200',
  //       '5-2.[개인_조정료]!AG6:AI200',
  //       '5-3.[편의점_조정료]!AG6:AI200',
  //       '1-1.[추가정보]!J8:V200'
  //     ];
  //     for (const range of ranges) {
  //       try {
  //         const data = await service.readSheet(sheetId, range, 'UNFORMATTED_VALUE');
  //         await service.updateSheet(sheetId, range, data);
  //       } catch (e) {
  //         console.log(`${sheetId} 시트 ${range} 작업 실패`);
  //       }
  //     }
  //     console.log(`${sheetId} 시트 작업 완료`);
  //   }
  //
  // });
  //
  // it.skip('test for numeric value in array', () => {
  //   const array = [
  //     [1, '2', 3, '', 'a', 'b', 'c'],
  //     [4, '5', 6, '', 'd', 'e', 'f'],
  //     [7, '8', 9, '', 'g', 'h', 'i']
  //   ];
  //   const map = array.map((row) => row.map((cell) => (cell === '' ? '' :
  //     isNaN(Number(cell)) ? cell : Number(cell))));
  //   console.log(map);
  // })
  //
  // it.skip('test spreadsheet read sheet', async () => {
  //   const SPREAD_SHEET_ID = '1F6KkPWNP1W83zC0S59jLwVniXsc8s0sxBDWCcYZlbxU';//'1O6uuslWIYCxzzPn3dkKuX7Tz8SU0kvQ1k7u0QBW4mQs';
  //   const sheetId = await service.getSheet(SPREAD_SHEET_ID)
  //   console.log(sheetId)
  // });
  //
  // it.skip('test spreadsheet copy one sheet', async () => {
  //   const SPREAD_SHEET_ID = '1F6KkPWNP1W83zC0S59jLwVniXsc8s0sxBDWCcYZlbxU';
  //   const TARGET_SHEET_ID = '1czPFWg44nvwkz_E2Ac8sQyzVLnlhnE3flEMvwrv-URU';
  //   await service.copyOneSheet(SPREAD_SHEET_ID, TARGET_SHEET_ID, 1511291106)
  // })
  //
  // it.skip('test sheet read', async () => {
  //   const SPREAD_SHEET_ID = '1ZAKeKQy7eUsE6Jqxi8N89tbg2Y0L50RXzumtCjE-Ytc';
  //   const VIEW_RANGE = '1-c_신고서!A1:ZZZ1000';
  //   const sheetId = await service.readSheet(SPREAD_SHEET_ID,VIEW_RANGE)
  //   console.log(sheetId)
  //   await service.updateSheet(SPREAD_SHEET_ID, '1-c_신고서의 사본!A1:ZZZ100000', sheetId)
  // });
  //
  // it.skip('test sheet drag copy', async () => {
  //   const SPREAD_SHEET_ID = '1O6uuslWIYCxzzPn3dkKuX7Tz8SU0kvQ1k7u0QBW4mQs';
  //   const VIEW_RANGE = 'ㄴ)보수총액!A1:ZZZ1000';
  //   const sheetId = await service.readSheet(SPREAD_SHEET_ID,VIEW_RANGE)
  //   console.log(sheetId)
  //   await service.updateSheetByUserEntering(SPREAD_SHEET_ID, 'ㄴ)보수총액의 사본!A1:ZZZ100000', sheetId)
  // });
  //
  // it.skip('test sheet drag copy_1', async () => {
  //   const SPREAD_SHEET_ID = '1O6uuslWIYCxzzPn3dkKuX7Tz8SU0kvQ1k7u0QBW4mQs';
  //   const VIEW_RANGE = '1-c_신고서!A1:ZZZ1000';
  //   const sheetId = await service.readSheet(SPREAD_SHEET_ID,VIEW_RANGE)
  //   console.log(sheetId)
  //   await service.updateSheetByUserEntering(SPREAD_SHEET_ID, '1-c_신고서의 사본!A1:ZZZ100000', sheetId)
  // });
  //
  // it.skip('delete test', async () => {
  //   console.log(new Date())
  //   await service.deleteFiles(['1rBWfngGOrHKfqb8gWkjReYyaFTFWW1lKOEGp98EXWjg'])
  //   console.log(new Date())
  // });
});
