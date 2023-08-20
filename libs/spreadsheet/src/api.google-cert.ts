import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';

import { GoogleCert } from '@libs/spreadsheet/google-cert';

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
];

export class ApiGoogleServiceCert implements Partial<GoogleCert> {
  isInitialize: boolean;

  async init(): Promise<GoogleAuth> {
    this.isInitialize = true;
    return new google.auth.GoogleAuth({
      keyFile: 'keys/probable-splice-395107-cb8bfb032a89.json',
      scopes: SCOPES,
    });
  }
}
