import { Mutex } from 'async-mutex';
import { ApiGoogleServiceCertMultiple } from '@libs/spreadsheet/api.google-cert.multiple';
import { GoogleApiSpreadsheetEditorCustom } from '@libs/spreadsheet/google-api.spreadsheet.editor.custom';

export class GoogleApiSpreadsheetEditorMultiple {
  private currentIndex = 0;
  private multipleEditors: GoogleApiSpreadsheetEditorCustom[] = [];
  private mutex = new Mutex();

  constructor(
    private readonly certMultipleModule: ApiGoogleServiceCertMultiple,
  ) {
    this.init = this.init.bind(this);
  }

  static async create(
    cert: ApiGoogleServiceCertMultiple,
  ): Promise<GoogleApiSpreadsheetEditorMultiple> {
    const instance = new GoogleApiSpreadsheetEditorMultiple(cert);
    await instance.init();
    return instance;
  }

  async init(): Promise<void> {
    const certs = await this.certMultipleModule.initMultiple();
    for (const cert of certs) {
      const editor = await GoogleApiSpreadsheetEditorCustom.create(cert, false);
      this.multipleEditors.push(editor);
    }
  }

  async getNextEditor(): Promise<GoogleApiSpreadsheetEditorCustom> {
    const release = await this.mutex.acquire();
    try {
      this.currentIndex = (this.currentIndex + 1) % this.multipleEditors.length;
      return this.multipleEditors[this.currentIndex];
    } finally {
      release();
    }
  }
}
