import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpreadsheetModule } from '@libs/spreadsheet';

@Module({
  imports: [SpreadsheetModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
