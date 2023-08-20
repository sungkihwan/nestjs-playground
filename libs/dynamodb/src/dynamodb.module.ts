import { Module } from '@nestjs/common';
import { DynamooseModule } from 'nestjs-dynamoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DynamodbService } from '@libs/dynamodb/dynamodb.service';
import { DynamooseModuleOptions } from 'nestjs-dynamoose/dist/interfaces/dynamoose-options.interface';

@Module({
  imports: [
    DynamooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): DynamooseModuleOptions => {
        return {
          aws: {
            accessKeyId: config.get<string>('AWS_ACCESS_KEY'),
            secretAccessKey: config.get<string>('AWS_SECRET_KEY'),
            region: config.get<string>('AWS_REGION'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [DynamodbService],
  exports: [DynamodbService],
})
export class DynamodbModule {}
