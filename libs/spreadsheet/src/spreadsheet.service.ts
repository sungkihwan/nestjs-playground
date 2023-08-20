import {
  Inject,
  Injectable,
  PayloadTooLargeException,
  Logger,
} from '@nestjs/common';

import {
  GoogleApiSpreadsheetEditor,
  IFIle,
  ISpreadSheet,
} from '@libs/spreadsheet/google-api.spreadsheet.editor';
import { GoogleApiSpreadsheetEditorMultiple } from '@libs/spreadsheet/google-api.spreadsheet.editor.multiple';
import {
  GoogleApiSpreadsheetEditorCustom,
  IData,
} from '@libs/spreadsheet/google-api.spreadsheet.editor.custom';

export const LIMITED_FAST_SHEET_EDITOR = Symbol('LIMITED_FAST_SHEET_EDITOR');
export const MULTIPLE_SHEET_EDITOR = Symbol('MULTIPLE_SHEET_EDITOR');

@Injectable()
export class SpreadsheetService {
  private readonly logger = new Logger(SpreadsheetService.name);

  constructor(
    @Inject(LIMITED_FAST_SHEET_EDITOR)
    private readonly fastEditor: GoogleApiSpreadsheetEditor,
    @Inject(MULTIPLE_SHEET_EDITOR)
    private readonly multipleEditor: GoogleApiSpreadsheetEditorMultiple,
  ) {}

  async createSheet(title?: string): Promise<ISpreadSheet> {
    return this.fastEditor.createSheet(title);
  }

  async getSheet(spreadsheetId: string): Promise<ISpreadSheet> {
    return this.fastEditor.getSheet(spreadsheetId);
  }

  async copySheet(spreadsheetId: string, destId: string): Promise<string> {
    return this.fastEditor.copySheet(spreadsheetId, destId);
  }

  async readSheet(
    spreadsheetId: string,
    range: string,
    renderOption: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' = 'FORMATTED_VALUE',
  ): Promise<any[]> {
    return this.fastEditor.readSheet(spreadsheetId, range, renderOption);
  }

  async addPermission(
    fileId: string,
    emailAddress: string,
    role: 'owner' | 'reader' | 'writer',
    type: 'user' | 'group' | 'domain' | 'anyone' = 'user',
  ): Promise<void> {
    return await this.fastEditor.addPermission(
      fileId,
      emailAddress,
      role,
      type,
    );
  }

  async readSheetWithMultiAuth(
    spreadsheetId: string,
    range: string,
    renderOption: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE' = 'FORMATTED_VALUE',
  ) {
    return await this.executeWithRetry(
      (editor) => editor.readSheet(spreadsheetId, range, renderOption),
      spreadsheetId,
      range,
    );
  }

  async readFolder(folderId: string): Promise<any> {
    return this.fastEditor.readFolder(folderId).catch((e) => {
      console.log(e);
    });
  }

  async updateSheet(
    spreadsheetId: string,
    range: string,
    values: any,
    inputOptions: 'RAW' | 'USER_ENTERED' = 'RAW',
  ): Promise<any> {
    return this.fastEditor.updateSheet(
      spreadsheetId,
      range,
      values,
      inputOptions,
    );
  }

  // 기존
  async updateSheetByUserEntering(
    spreadsheetId: string,
    range: string,
    values: any,
  ): Promise<any> {
    return this.fastEditor.updateSheet(
      spreadsheetId,
      range,
      values,
      'USER_ENTERED',
    );
  }

  async updateSheetWithMultiAuth(
    spreadsheetId: string,
    range: string,
    values: any,
    inputOptions: 'RAW' | 'USER_ENTERED' = 'USER_ENTERED',
  ): Promise<any> {
    this.logger.log(
      `스프레드 시트 업데이트를 시작합니다. spreadsheetId: ${spreadsheetId} range: ${range} values: ${values}`,
    );

    return await this.executeWithRetry(
      (editor) =>
        editor.updateSheet(spreadsheetId, range, values, inputOptions),
      spreadsheetId,
      range,
    );
  }

  // new -> multiple certs and bulk update 적용중
  async batchUpdateSheetByUserEntering(
    spreadsheetId: string,
    data: IData[],
    inputOptions: 'RAW' | 'USER_ENTERED' = 'RAW',
    includeValuesInResponse = null,
    responseDateTimeRenderOption = null,
    responseValueRenderOption = null,
    maxRetries = 5,
  ): Promise<any> {
    this.logger.log(
      `스프레드 시트 배치 업데이트를 시작합니다. spreadsheetId: ${spreadsheetId}, maxRetries: ${maxRetries}`,
    );

    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        const currentEditor: GoogleApiSpreadsheetEditorCustom =
          await this.multipleEditor.getNextEditor();
        return await currentEditor.updateSheetBatch(
          spreadsheetId,
          data,
          inputOptions,
          includeValuesInResponse,
          responseDateTimeRenderOption,
          responseValueRenderOption,
        );
      } catch (e) {
        this.logger.warn(
          `spreadsheet api error!!, spreadsheetId: ${spreadsheetId}, error: ${e.message}`,
        );
        this.logger.log(`다음 에디터로 업데이트를 시작합니다.`);
      }
    }

    throw new PayloadTooLargeException(
      `${maxRetries}번의 재시도를 하였으나 sheetId: ${spreadsheetId} 업데이트에 실패했습니다.`,
    );
  }

  async getValuesByMultiEditor(
    spreadsheetId: string,
    range: string,
    maxRetries = 5,
  ): Promise<any> {
    this.logger.log(
      `스프레드 시트의 값들을 가져오는 작업을 시작합니다. spreadsheetId: ${spreadsheetId}, range: ${range}, maxRetries: ${maxRetries}`,
    );

    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        const currentEditor: GoogleApiSpreadsheetEditorCustom =
          await this.multipleEditor.getNextEditor();
        return await currentEditor.readSheet(
          spreadsheetId,
          range,
          'FORMATTED_VALUE',
        );
      } catch (e) {
        this.logger.warn(
          `spreadsheet api error!!, spreadsheetId: ${spreadsheetId}, range: ${range}, error: ${e.message}`,
        );
        this.logger.log(`다음 에디터로 값을 가져오는 작업을 시작합니다.`);
      }
    }

    throw new PayloadTooLargeException(
      `${maxRetries}번의 재시도를 하였으나 spreadsheetId: ${spreadsheetId}, range: ${range} 값들을 가져오는 작업에 실패했습니다.`,
    );
  }

  async executeWithRetry(
    func: (editor: GoogleApiSpreadsheetEditorCustom) => Promise<any>,
    id?: string,
    name?: string,
    maxRetries = 5,
  ) {
    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        const currentEditor: GoogleApiSpreadsheetEditorCustom =
          await this.multipleEditor.getNextEditor();
        return await func(currentEditor);
      } catch (e) {
        if (retries == maxRetries - 1) {
          throw new PayloadTooLargeException(`${maxRetries}번의 재시도를 하였으나 id: ${id}, name: ${name} 작업에 실패했습니다. 
          error : ${e.message}`);
        }
        this.logger.warn(
          `spreadsheet api error!!, id: ${id}, name: ${name}, error: ${e.message}`,
        );
        this.logger.log(`다음 에디터로 업데이트를 시작합니다.`);
      }
    }
  }

  async deleteFile(fileId: string) {
    return this.fastEditor.deleteFile(fileId);
  }

  async deleteFiles(fileIds: string[]) {
    await Promise.all(
      fileIds.map((fileId: string) => {
        return this.deleteFile(fileId);
      }),
    );
  }

  // async moveFolderByMultiEditor(id: string, folderId: string, maxRetries = 5) {
  //   this.logger.log(`스프레드 시트 이동을 시작합니다. id: ${id}, folderId: ${folderId}, maxRetries: ${maxRetries}`);
  //   return await this.executeWithRetry((editor) => editor.moveFolder(id, folderId), id, folderId, maxRetries);
  // }
  //
  // // auth 간 권한 문제로 일단 사용하지 않음
  // async copyFileByMultiEditor(id: string, name: string, maxRetries = 5): Promise<string> {
  //   this.logger.log(`스프레드 시트 복사를 시작합니다. id: ${id}, name: ${name}, maxRetries: ${maxRetries}`);
  //   return await this.executeWithRetry((editor) => editor.copyFile(id, name), id, name, maxRetries);
  // }

  async moveFolderByMultiEditor(id: string, folderId: string, maxRetries = 5) {
    this.logger.log(
      `스프레드 시트 이동을 시작합니다. id: ${id}, folderId: ${folderId}, maxRetries: ${maxRetries}`,
    );

    for (let retries = 0; retries < maxRetries; retries++) {
      try {
        const currentEditor: GoogleApiSpreadsheetEditorCustom =
          await this.multipleEditor.getNextEditor();
        return await currentEditor.moveFolder(id, folderId);
      } catch (e) {
        this.logger.warn(
          `spreadsheet api error!!, id: ${id}, folderId: ${folderId}, error: ${e.message}`,
        );
        this.logger.log(`다음 에디터로 업데이트를 시작합니다.`);
      }
    }

    throw new PayloadTooLargeException(
      `${maxRetries}번의 재시도를 하였으나 id: ${id}, folderId: ${folderId} 스프레드시트 이동에 실패했습니다.`,
    );
  }

  async getFile(id: string): Promise<IFIle> {
    return this.fastEditor.getFile(id);
  }

  // 권한문제로 사용 안함
  // async copyFileByMultiEditor(id: string, name: string, maxRetries = 5): Promise<string> {
  //   this.logger.log(`스프레드 시트 복사를 시작합니다. id: ${id}, name: ${name}, maxRetries: ${maxRetries}`);
  //
  //   for (let retries = 0; retries < maxRetries; retries++) {
  //     try {
  //       const currentEditor: GoogleApiSpreadsheetEditorCustom = await this.multipleEditor.getNextEditor();
  //       return await currentEditor.copyFile(id, name)
  //     } catch (e) {
  //       this.logger.warn(`spreadsheet api error!!, id: ${id}, name: ${name}, error: ${e.message}`);
  //       this.logger.log(`다음 에디터로 업데이트를 시작합니다.`);
  //     }
  //   }
  //
  //   throw new PayloadTooLargeException(`${maxRetries}번의 재시도를 하였으나 id: ${id}, name: ${name} 스프레드시트 복사에 실패했습니다.`);
  // }

  async copyOneSheet(
    spreadsheetId: string,
    destId: string,
    sheetId: number,
  ): Promise<any> {
    return this.fastEditor.copyOneSheetToSpreadsheet({
      spreadsheetId,
      destId,
      sheetId,
    });
  }
}
