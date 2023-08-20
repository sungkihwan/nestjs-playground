export async function sleep(millis: number) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}

export const LONG_TIME = 10000000;
