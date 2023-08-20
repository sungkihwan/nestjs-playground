import { Module } from '@nestjs/common';

import {
  LIMITED_FAST_SHEET_EDITOR,
  MULTIPLE_SHEET_EDITOR,
  SpreadsheetService,
} from '@libs/spreadsheet/spreadsheet.service';
import { ApiGoogleServiceCert } from '@libs/spreadsheet/api.google-cert';
import { GoogleApiSpreadsheetEditor } from '@libs/spreadsheet/google-api.spreadsheet.editor';
import { ApiGoogleServiceCertMultiple } from '@libs/spreadsheet/api.google-cert.multiple';
import { GoogleApiSpreadsheetEditorMultiple } from '@libs/spreadsheet/google-api.spreadsheet.editor.multiple';

@Module({
  providers: [
    ApiGoogleServiceCert,
    ApiGoogleServiceCertMultiple,
    {
      provide: LIMITED_FAST_SHEET_EDITOR,
      useFactory: async (cert) =>
        GoogleApiSpreadsheetEditor.create(cert, false),
      inject: [ApiGoogleServiceCert],
    },
    SpreadsheetService,
    {
      provide: MULTIPLE_SHEET_EDITOR,
      useFactory: async (certs) =>
        GoogleApiSpreadsheetEditorMultiple.create(certs),
      inject: [ApiGoogleServiceCertMultiple],
    },
  ],
  exports: [
    LIMITED_FAST_SHEET_EDITOR,
    MULTIPLE_SHEET_EDITOR,
    SpreadsheetService,
  ],
})
export class SpreadsheetModule {}
