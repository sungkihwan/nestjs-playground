import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SpreadsheetModule } from '@libs/spreadsheet';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SpreadsheetModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
