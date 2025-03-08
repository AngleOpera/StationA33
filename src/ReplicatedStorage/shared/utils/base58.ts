// From MIT licensed https://github.com/jimeh/node-base58
/*
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const alphabetLookup = alphabet
  .split('')
  .reduce((lookup: Record<string, number>, char, index) => {
    lookup[char] = index
    return lookup
  }, {})

export function intToBase58(num: number): string {
  if (num < 0 || num !== num || math.floor(num) !== num) {
    throw 'Value passed is not a non-negative safe integer.'
  }
  let str = ''
  let modulus
  while (num >= alphabet.size()) {
    modulus = num % alphabet.size()
    str = alphabet[modulus] + str
    num = math.floor(num / alphabet.size())
  }
  return alphabet[num] + str
}

export function base58ToInt(str: string): number {
  return str
    .split('')
    .reverse()
    .reduce((num, character, index) => {
      if (alphabetLookup[character] === undefined)
        throw 'Value passed is not a valid Base58 string.'
      return num + alphabetLookup[character] * math.pow(alphabet.size(), index)
    }, 0)
}
*/
