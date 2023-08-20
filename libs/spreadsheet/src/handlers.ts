import { sleep } from '@libs/spreadsheet/sleep';

export async function handleTimeout<T>(
  processor: () => Promise<T>,
): Promise<T> {
  for (let i = 0; i < 10; i++) {
    try {
      return await processor();
    } catch (e) {
      console.log(e.message);
      if (e.message.indexOf('ETIMEDOUT') > 0) {
        await sleep(500);
        continue;
      }
      throw e;
    }
  }
  throw new Error('ETIMEDOUT');
}

export async function retryHandler<T>(
  processor: () => Promise<T>,
  count = 5,
): Promise<T> {
  let error;
  for (let i = 0; i < count; i++) {
    try {
      const result = await processor();
      return result;
    } catch (e) {
      console.log(e.message);
      error = e;
      await sleep(500);
    }
  }
  throw error;
}

export function getErrorMessageFromRPC(rpcMessage: string): string {
  try {
    const error = JSON.parse(rpcMessage);
    return error.message;
  } catch (e) {
    return rpcMessage;
  }
}
