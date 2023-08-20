import { google } from 'googleapis';
import { AuthClient } from 'google-auth-library/build/src/auth/authclient';
import { GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';
import * as AsyncLock from 'async-lock';

import { retryHandler } from '@libs/spreadsheet/handlers';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

export interface IFIle {
  name: string;
  type: string;
  id: string;
  kind: string;
}

export interface ISpreadSheet {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: ISheet[];
}

export interface ISheet {
  sheetId: number;
  title: string;
  index: number;
  sheetType: string;
  gridProperties: any;
}

export interface IData {
  majorDimension?: string | null;
  range?: string | null;
  values?: any[][] | null;
}

export class GoogleApiSpreadsheetEditorCustom {
  private isInitialized = false;
  private readonly lock = new AsyncLock();

  constructor(
    private readonly googleAuth: GoogleAuth,
    private readonly isLock = false,
  ) {
    this.readSheet = this.readSheet.bind(this);
  }

  private oAuth2Client: any;

  static async create(
    googleAuth: GoogleAuth,
    isLock = false,
  ): Promise<GoogleApiSpreadsheetEditorCustom> {
    const instance = new GoogleApiSpreadsheetEditorCustom(googleAuth, isLock);
    await instance.init();
    return instance;
  }

  async init(): Promise<void> {
    this.oAuth2Client = this.googleAuth;
    this.isInitialized = true;
  }

  async createSheet(title?: string): Promise<ISpreadSheet> {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
      sheets.spreadsheets.create(
        {
          requestBody: {
            properties: {
              title,
            },
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.mapEntityToDomain(res.data));
        },
      );
    });
  }

  async getSheet(spreadsheetId: string): Promise<ISpreadSheet> {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
      sheets.spreadsheets.get(
        {
          spreadsheetId,
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(this.mapEntityToDomain(res.data));
        },
      );
    });
  }

  private mapEntityToDomain(entity: any) {
    return {
      spreadsheetId: entity.spreadsheetId,
      title: entity.properties.title,
      spreadsheetUrl: entity.spreadsheetId,
      sheets: entity.sheets.map((sheet) => sheet.properties as ISheet),
    };
  }

  async copySheet(spreadsheetId: string, destId: string): Promise<string> {
    const getSpreadSheet = await this.getSheet(spreadsheetId);
    const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
    for (let i = 0; i < getSpreadSheet.sheets.length; i++) {
      const sheet = getSpreadSheet.sheets[i];
      const copiedSheet = await this.copyOneSheet({
        spreadsheetId,
        sheetId: sheet.sheetId,
        destId,
      });
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: destId,
        requestBody: {
          requests: [this.mapSheetToRequest(copiedSheet)],
        },
      });
    }
    const destSpreadSheet = await this.getSheet(destId);
    const requests = [this.mapSheetToDeleteRequest(destSpreadSheet.sheets[0])];
    const res = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: destId,
      requestBody: {
        requests,
      },
    });
    return res.data.spreadsheetId;
  }

  private mapSheetToRequest(sheet: ISheet): any {
    const title = sheet.title.replace('의 사본', '');
    return {
      updateSheetProperties: {
        properties: {
          ...sheet,
          title,
        },
        fields: '*',
      },
    };
  }

  private mapSheetToDeleteRequest(sheet: ISheet): any {
    return {
      deleteSheet: {
        sheetId: sheet.sheetId,
      },
    };
  }

  private async copyOneSheet(props: {
    spreadsheetId: string;
    sheetId: number;
    destId: string;
  }): Promise<ISheet> {
    if (!this.isInitialized) {
      await this.init();
    }
    const { sheetId, spreadsheetId, destId } = props;

    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
      sheets.spreadsheets.sheets.copyTo(
        {
          spreadsheetId,
          sheetId,
          requestBody: {
            destinationSpreadsheetId: destId,
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve({
            title: res.data.title,
            sheetId: res.data.sheetId,
            index: res.data.index,
            gridProperties: res.data.gridProperties,
            sheetType: res.data.sheetType,
          });
        },
      );
    });
  }

  async copyOneSheetToSpreadsheet(props: {
    spreadsheetId: string;
    sheetId: number;
    destId: string;
  }): Promise<void> {
    const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
    const { sheetId, spreadsheetId, destId } = props;
    const copiedSheet = await this.copyOneSheet({
      spreadsheetId,
      sheetId,
      destId,
    });
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: destId,
      requestBody: {
        requests: [this.mapSheetToRequest(copiedSheet)],
      },
    });
  }

  async readFolder(id: string) {
    if (!this.isInitialized) {
      await this.init();
    }

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    const { data } = await drive.files.list({
      driveId: id,
      includeItemsFromAllDrives: true,
      corpora: 'drive',
      supportsAllDrives: true,
    });
    return data.files;
  }

  async readSheet(
    spreadsheetId: string,
    range: string,
    renderOption: 'FORMATTED_VALUE' | 'UNFORMATTED_VALUE',
  ): Promise<any[]> {
    if (!this.isInitialized) {
      await this.init();
    }

    const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
      valueRenderOption: renderOption,
    });
    return res.data.values;
  }

  async updateSheet(
    spreadsheetId: string,
    range: string,
    values: any,
    valueInputOption = 'RAW',
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
      if (this.isLock) {
        this.lock.acquire('old-google-api', () => {
          sheets.spreadsheets.values.update(
            {
              spreadsheetId,
              range,
              valueInputOption,
              requestBody: {
                // range: '1. 법인설립 배정_list!C892:D892',
                values,
              },
            },
            (err, res) => {
              if (err) {
                reject(err);
                return;
              }
              resolve(res.data);
            },
          );
        });
        return;
      }
      sheets.spreadsheets.values.update(
        {
          spreadsheetId,
          range,
          valueInputOption,
          requestBody: {
            // range: '1. 법인설립 배정_list!C892:D892',
            values,
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res.data);
        },
      );
    });
  }

  async addPermission(
    fileId: string,
    emailAddress: string,
    role: 'owner' | 'reader' | 'writer',
    type: 'user' | 'group' | 'domain' | 'anyone' = 'user',
  ): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: role, // owner, writer, reader 중 선택
        type: type, // user, group, domain, anyone 중 선택
        emailAddress: emailAddress, // 권한을 부여할 이메일 주소
      },
      // 이메일 알림 보내지 않기 위해 필요
      sendNotificationEmail: false,
    });
  }

  async updateSheetBatch(
    spreadsheetId: string,
    data: IData[],
    valueInputOption = 'RAW',
    includeValuesInResponse = null,
    responseDateTimeRenderOption = null,
    responseValueRenderOption = null,
  ): Promise<any> {
    if (!this.isInitialized) {
      await this.init();
    }

    // const params = {
    //   spreadsheetId,
    //   requesyBody: {
    // data: [
    // {
    //   majorDimension: null, // string | null;
    //   range: '[H-2]수집장!B466:AB568', // string | null;
    //   values: [1][2] // any[][] | null;
    // }
    // ],
    //     includeValuesInResponse: true, // boolean | null;
    //     responseDateTimeRenderOption: null, //string | null;
    //     responseValueRenderOption: null, // string | null;
    //     valueInputOption: 'RAW' //string | null;
    //   }
    // }

    return new Promise((resolve, reject) => {
      const sheets = google.sheets({ version: 'v4', auth: this.oAuth2Client });
      sheets.spreadsheets.values.batchUpdate(
        {
          spreadsheetId,
          requestBody: {
            data,
            valueInputOption,
            includeValuesInResponse,
            responseDateTimeRenderOption,
            responseValueRenderOption,
          },
        },
        (err, res) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(res.data);
        },
      );
    });
  }

  async moveFolder(id: string, folderId: string) {
    if (!this.isInitialized) {
      await this.init();
    }

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    const result = await drive.files.get({ fileId: id, fields: 'parents' });
    const previousParents = result.data.parents.join(',');
    await drive.files.update({
      fileId: id,
      addParents: folderId,
      removeParents: previousParents,
      fields: 'id, parents',
      supportsAllDrives: true,
    });
  }

  async getFile(id: string): Promise<IFIle> {
    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    const result = await drive.files.get({ fileId: id });
    return {
      id: result.data.id,
      name: result.data.name,
      type: result.data.mimeType,
      kind: result.data.kind,
    };
  }

  async copyFile(id: string, name: string): Promise<string> {
    if (!this.isInitialized) {
      await this.init();
    }

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    const result = await retryHandler(
      () =>
        drive.files.copy({
          fileId: id,
          fields: '*',
          requestBody: {
            name,
          },
          supportsAllDrives: true,
        }),
      3,
    );
    return result.data.id;
  }

  async deleteFile(id: string): Promise<void> {
    if (!this.isInitialized) {
      await this.init();
    }

    const drive = google.drive({ version: 'v3', auth: this.oAuth2Client });
    await drive.files.delete({
      fileId: id,
    });
  }

  getAuthUrl(): string {
    return this.oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
  }

  getAuthType(): GoogleAuth | AuthClient {
    return this.oAuth2Client;
  }
}
