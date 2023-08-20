import { InjectRedis } from '@nestjs-modules/ioredis';
import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';

const PREFIX_LOCK = 'LOCK_';

@Injectable()
export class RedisMutex {
  private lockedList: string[] = [];
  private timeoutIDs: {
    [key: string]: NodeJS.Timeout;
  } = {};
  private logger: Logger = new Logger(RedisMutex.name);
  constructor(@InjectRedis() private readonly redis: Redis) {
    redis.keys(PREFIX_LOCK + ':*').then((keys) => {
      keys.forEach((v) => redis.del(v));
    });
  }

  async onApplicationShutdown() {
    for (const locked of this.lockedList) {
      await this.redis.del(locked);
    }
  }

  private readonly SET_LOCK_LUA_SCRIPT = `
      if redis.call("set", KEYS[1], ARGV[1], "PX", ARGV[2], "NX") then
        return 1
      else
        return 0
      end
    `;

  private readonly UN_LOCK_LUA_SCRIPT = `
      redis.call("del", KEYS[1]);
      redis.call("publish", KEYS[1], "UNLOCKED");
      return 1;
    `;

  async lock(
    lockName: string,
    desc: string,
    timeout = 1000 * 5,
  ): Promise<boolean> {
    lockName = PREFIX_LOCK + lockName;
    this.timeoutIDs[lockName] = setTimeout(() => {
      const value = this.redis.get(lockName);
      if (value) {
        this.logger.error(
          `(${lockName})lock timeout exceeded(${JSON.stringify(value)})`,
        );
      }
    }, timeout);

    const result = await this.retryHandler(
      () => this.redis.set(lockName, desc, 'PX', timeout + 200, 'NX'),
      timeout,
    );

    if (result) {
      this.lockedList.push(lockName);
      return result;
    } else {
      return false;
    }
  }

  async unlock(lockName: string): Promise<boolean> {
    lockName = PREFIX_LOCK + lockName;
    clearTimeout(this.timeoutIDs[lockName]);
    delete this.timeoutIDs[lockName];
    const result = await this.retryHandler(() => this.redis.del(lockName));

    if (result) {
      const index = this.lockedList.findIndex((v) => v === lockName);
      this.lockedList = [
        ...this.lockedList.slice(0, index),
        ...this.lockedList.slice(index + 1, this.lockedList.length),
      ];
      return true;
    } else {
      return false;
    }
  }

  private async retryHandler(
    func: () => Promise<string | number>,
    timeout = 1000,
    wait = 100,
  ): Promise<boolean> {
    const retry = timeout / wait;
    for (let i = 0; i < retry; i++) {
      try {
        const result = await func();
        if (result === 'OK' || !isNaN(<number>result)) {
          return true;
        }
        await this.delay(wait);
      } catch (e) {
        if (i == retry - 1) {
          return false;
        } else {
          console.log(`redis lock error : ${e.message}`);
        }
      }
    }
    return false;
  }

  // 아직 개발 미완성 사용금지
  async lock_v2(
    lockName: string,
    desc: string,
    waitTime = 1000 * 5,
    leaseTime = 1000 * 10,
  ): Promise<boolean> {
    const startTime = Date.now();
    const isLocked = await this.executeWithRetry(
      () =>
        this.redis.eval(this.SET_LOCK_LUA_SCRIPT, 1, lockName, desc, leaseTime),
      3,
    );

    if (isLocked) {
      return true;
    } else {
      const wait = waitTime - (startTime - Date.now());
      const timeout = new Promise<boolean>((resolve) => {
        setTimeout(() => {
          this.redis.unsubscribe(lockName);
          resolve(false);
        }, wait);
      });

      const lockObtain = this.subscribeAndWaitForUnlock(lockName, wait)
        .then(async () => {
          return await this.executeWithRetry(
            () =>
              this.redis.eval(
                this.SET_LOCK_LUA_SCRIPT,
                1,
                lockName,
                desc,
                leaseTime,
              ),
            3,
          );
        })
        .catch((e) => {
          console.log(e.message);
          return false;
        });

      return await Promise.race([timeout, lockObtain]);
    }
  }

  // 아직 개발 미완성 사용금지
  async unlock_v2(lockName: string): Promise<boolean> {
    return await this.executeWithRetry(() =>
      this.redis.eval(this.UN_LOCK_LUA_SCRIPT, 1, lockName),
    );
  }

  private async subscribeAndWaitForUnlock(
    lockName: string,
    timeout: number,
  ): Promise<boolean> {
    let timeoutId: NodeJS.Timeout | null = null;

    return new Promise<boolean>(async (resolve, reject) => {
      const onMessage = (channel: string, message: string) => {
        if (channel === lockName && message === 'UNLOCKED') {
          if (timeoutId) clearTimeout(timeoutId);
          this.redis.removeListener('message', onMessage);
          resolve(true);
        }
      };

      const timeoutPromise = new Promise<void>((_, rej) => {
        timeoutId = setTimeout(() => {
          this.redis.removeListener('message', onMessage);
          rej(new Error('Timeout while waiting for unlock'));
        }, timeout);
      });

      try {
        await this.executeWithRetry<void>(() => {
          return new Promise<void>((res, rej) => {
            this.redis.subscribe(lockName, (err) => {
              if (err) {
                this.redis.removeListener('message', onMessage);
                rej(err);
              } else {
                this.redis.on('message', onMessage);
                res();
              }
            });
          });
        });

        await Promise.race([timeoutPromise]);
      } catch (e) {
        if (timeoutId) clearTimeout(timeoutId);
        console.error(`subscribeAndWaitForUnlock 에러: ${e.message}`);
        reject(e);
      }
    });
  }

  private async executeWithRetry<T>(
    func: () => Promise<T>,
    retryCount = 3,
    delayDuration = 100,
  ): Promise<boolean> {
    let lastError: Error;

    for (let i = 0; i < retryCount; i++) {
      try {
        return (await func()) === 1;
      } catch (error) {
        lastError = error;
        console.error(`${i + 1}회의 시도에서 오류 발생: ${error.message}`);
        await this.delay(delayDuration);
        delayDuration *= 2;
      }
    }

    console.error(
      `${retryCount}회의 재시도가 모두 실패했습니다: ${lastError.message}`,
    );
    throw lastError;
  }

  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
