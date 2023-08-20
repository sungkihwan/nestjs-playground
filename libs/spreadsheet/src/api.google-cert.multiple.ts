import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';

import * as fs from 'fs';
import * as path from 'path';

const spreadsheetDir = './keys';
export const API_KEYS: string[] = [];

fs.readdirSync(spreadsheetDir).forEach((file) => {
  API_KEYS.push(path.join(spreadsheetDir, file));
});

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata',
];

export class ApiGoogleServiceCertMultiple {
  isInitialize: boolean;

  async initMultiple(): Promise<GoogleAuth[]> {
    this.isInitialize = true;
    const promises = API_KEYS.map(
      (keyFile) =>
        new google.auth.GoogleAuth({
          keyFile,
          scopes: SCOPES,
        }),
    );
    return await Promise.all(promises);
  }
}
