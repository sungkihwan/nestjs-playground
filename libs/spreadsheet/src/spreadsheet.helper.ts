import * as _ from 'lodash';

export function empties(num: number): any[] {
  return _.fill(new Array(num), undefined);
}

export function emptyRows(count: number): any[] {
  return _.range(count).map(() => []);
}

export function numberToAlphabet(number): string {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (number <= 0) throw 'Invalid Number';
  let result = '';
  while (number > 0) {
    const remainder = (number - 1) % 26;
    result = ALPHABET[remainder] + result;
    number = Math.floor((number - 1) / 26);
  }
  return result;
}

export function alphabetToNumber(alphabet): number {
  const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const alphabetMap = {};
  for (let i = 0; i < ALPHABET.length; i++) {
    alphabetMap[ALPHABET[i]] = i + 1;
  }

  let result = 0;
  let multiplier = 1;
  for (let i = alphabet.length - 1; i >= 0; i--) {
    const char = alphabet[i];
    if (!alphabetMap[char]) {
      throw 'Invalid Alphabet';
    }
    result += alphabetMap[char] * multiplier;
    multiplier *= 26;
  }

  return result;
}
