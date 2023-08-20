import { GoogleAuth } from 'google-auth-library/build/src/auth/googleauth';
import { OAuth2Client } from 'google-auth-library/build/src/auth/oauth2client';

export interface GoogleCert {
  isInitialize: boolean;

  init(): Promise<GoogleAuth | OAuth2Client>;
}
