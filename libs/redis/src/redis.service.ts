import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { RedisQueueAirtableConstant } from '@libs/redis/constant/redis.queue.airtable.constant';
import { RedisQueueEtcConstant } from './constant/redis.queue.etc.constant';

@Injectable()
export class RedisService {
  constructor(
    @InjectQueue(RedisQueueAirtableConstant.NAME)
    private readonly airtableQueue: Queue,
    @InjectQueue(RedisQueueEtcConstant.NAME) private readonly etcQueue: Queue,
  ) {}

  exists(key: string) {
    return this.etcQueue.client.exists(key);
  }

  get = async (key: string) => {
    return this.etcQueue.client.get(key);
  };

  set = (key: string, value: string) => {
    return this.etcQueue.client.set(key, value);
  };

  setex = (key: string, ex: number, value: string) => {
    return this.etcQueue.client.setex(key, ex, value);
  };

  del = (key: string) => {
    return this.etcQueue.client.del(key);
  };

  emitAirtableQueueEvent = async (name: string, data: any) => {
    this.airtableQueue.add(name, data);
  };

  // emitAirtableEventTest = async (name: string, data: any) => {
  //     return this.airtableQueue.add(name, data)
  // }
  //
  // async getTestJobsCount(): Promise<number> {
  //     const waitingCount = await this.airtableQueue.getWaitingCount();
  //     console.log(`waitingCount : ${waitingCount}`)
  //     const activeCount = await this.airtableQueue.getActiveCount();
  //     console.log(`activeCount : ${activeCount}`)
  //     const delayedCount = await this.airtableQueue.getDelayedCount();
  //     console.log(`delayedCount : ${delayedCount}`)
  //     return waitingCount + activeCount + delayedCount;
  // }

  zadd(key: any, scoreMembers: (string | Buffer | number)[]) {
    this.airtableQueue.client.zadd(key, ...scoreMembers);
  }

  zcount(key: any) {
    return this.airtableQueue.client.zcount(key, 0, 10000000);
  }

  async getJobsCount(): Promise<number> {
    // const [waitingCount, activeCount] = await Promise.all([
    //         this.scrapingOnlyQueue.getWaitingCount(),
    //         this.scrapingOnlyQueue.getActiveCount()
    // ])
    // console.log(`waitingCount : ${waitingCount}`)
    // console.log(`activeCount : ${activeCount}`)
    // return waitingCount + activeCount;

    const [waitingCount] = await Promise.all([this.etcQueue.getWaitingCount()]);
    return waitingCount;
  }

  hget(key: any) {
    this.airtableQueue.client.hgetall(key);
  }

  async redisGet(key: any) {
    return JSON.parse(await this.airtableQueue.client.get(key));
  }

  redisWatchTest(key: any, data: any) {
    this.airtableQueue.client.watch(key, (err) => {
      if (err) throw err;
      console.log('tttttt');
      return this.airtableQueue.client
        .multi()
        .set(key, data)
        .get(key)
        .exec((err, result) => {
          console.log(result);
        });
    });
  }
}
