import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullRootModuleOptions } from '@nestjs/bull/dist/interfaces/bull-module-options.interface';
import { extractPort } from '@libs/utils/extract-port';

import { RedisQueueHometaxConstant } from '@libs/redis/constant/redis.queue.hometax.constant';
import { RedisQueueAirtableConstant } from '@libs/redis/constant/redis.queue.airtable.constant';
import { RedisQueueEtcConstant } from '@libs/redis/constant/redis.queue.etc.constant';
import { RedisQueueSpreadsheetConstant } from '@libs/redis/constant/redis.queue.spreadsheet.constant';
import { RedisQueueHiddenMoneyConstant } from '@libs/redis/constant/redis.queue.hiddenmoney.constant';

import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { RedisQueueHiddenmoneyOnlyScraping } from '@libs/redis/constant/redis.queue.hiddenmoney.only.scraping';
import { RedisService } from '@libs/redis/redis.service';
import { RedisMutex } from '@libs/redis/redis-mutex';

@Module({
  imports: [
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): RedisModuleOptions => ({
        config: {
          url: `${config.get('REDIS_HOST')}:${extractPort(
            config.get('REDIS_PORT'),
          )}`,
        },
      }),
      inject: [ConfigService],
    }),
    // BullModule.forRootAsync({
    //   imports: [SharedConfigModule],
    //   useFactory: (config: ConfigService): BullRootModuleOptions => {
    //     if (process.env.NODE_ENV === 'local') {
    //       console.log('this is local redis cluster option setup')
    //       return {
    //         createClient: () => {
    //           const cluster = new Redis.Cluster([
    //             { host: config.get('REDIS_CLUSTER_HOST_1'), port: extractPort(config.get('REDIS_CLUSTER_PORT_1')) },
    //             { host: config.get('REDIS_CLUSTER_HOST_2'), port: extractPort(config.get('REDIS_CLUSTER_PORT_2')) },
    //             { host: config.get('REDIS_CLUSTER_HOST_3'), port: extractPort(config.get('REDIS_CLUSTER_PORT_3')) }
    //           ]);
    //
    //           // scaleReads 옵션 설정
    //           cluster.options.scaleReads = 'slave';
    //           return cluster;
    //         },
    //       };
    //     }
    //     else if (process.env.NODE_ENV === 'production') {
    //       return {
    //         createClient: () => {
    //           const cluster = new Redis.Cluster([
    //             { host: config.get('REDIS_CLUSTER_HOST_1'), port: extractPort(config.get('REDIS_CLUSTER_PORT_1')) },
    //             { host: config.get('REDIS_CLUSTER_HOST_2'), port: extractPort(config.get('REDIS_CLUSTER_PORT_2')) }
    //           ]);
    //
    //           // scaleReads 옵션 설정
    //           cluster.options.scaleReads = 'slave';
    //
    //           return cluster;
    //         },
    //         defaultJobOptions: {
    //           attempts: 3,
    //           removeOnComplete: true,
    //           backoff: {
    //             type: 'exponential',
    //             delay: 500,
    //           }
    //         }
    //       };
    //     } else {
    //       return {
    //         redis: {
    //           host: config.get('REDIS_HOST'),
    //           port: extractPort(config.get('REDIS_PORT')),
    //         },
    //         defaultJobOptions: {
    //           attempts: 3,
    //           removeOnComplete: true,
    //           backoff: {
    //             type: 'exponential',
    //             delay: 500,
    //           }
    //         }
    //       };
    //     }
    //   },
    //   inject: [ConfigService]
    // }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): BullRootModuleOptions => ({
        redis: {
          host: config.get('REDIS_HOST'),
          port: extractPort(config.get('REDIS_PORT')),
        },
        // retry는 Process에서 throw를 내뱉으면 오류로 간주해 exponential logic 최대 3회를 실행
        defaultJobOptions: {
          attempts: 3,
          removeOnComplete: true,
          backoff: {
            type: 'exponential',
            delay: 500,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: RedisQueueHometaxConstant.NAME,
    }),
    BullModule.registerQueue({
      name: RedisQueueHiddenMoneyConstant.NAME,
    }),
    BullModule.registerQueue({
      name: RedisQueueHiddenmoneyOnlyScraping.NAME,
      limiter: {
        max: 200,
        duration: 10,
      },
    }),
    BullModule.registerQueue({
      name: RedisQueueHometaxConstant.NAME_SLOW,
      limiter: {
        max: 50,
        duration: 1000 * 60 * 30, // 30분에 50개씩 처리
      },
    }),
    BullModule.registerQueue({
      name: RedisQueueSpreadsheetConstant.NAME,
      limiter: {
        max: 1500,
        duration: 1000 * 60,
      },
    }),
    BullModule.registerQueue({
      name: RedisQueueAirtableConstant.NAME,
    }),
    BullModule.registerQueue({
      name: RedisQueueEtcConstant.NAME,
    }),
  ],
  providers: [RedisService, RedisMutex],
  exports: [RedisService, RedisMutex],
})
export class RedisServiceModule {}
