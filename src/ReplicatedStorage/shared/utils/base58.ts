// From MIT licensed https://github.com/jimeh/node-base58
const alphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')
const alphabetSize = alphabet.size()
const alphabetLookup = alphabet.reduce(
  (lookup: Record<string, number>, char, index) => {
    lookup[char] = index
    return lookup
  },
  {},
)
const columnValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, i) =>
  math.pow(alphabetSize, i),
)

export function intToBase58(num: number): string {
  if (num < 0 || num !== num || math.floor(num) !== num) {
    throw 'Value passed is not a non-negative safe integer.'
  }
  let str = ''
  let modulus
  while (num >= alphabetSize) {
    modulus = num % alphabetSize
    str = alphabet[modulus] + str
    num = math.floor(num / alphabetSize)
  }
  return alphabet[num] + str
}

export function base58ToInt(str: string): number {
  let num = 0
  for (let i = str.size(), column = 0; i > 0; i--) {
    const character = str.sub(i, i)
    if (character === '_') continue
    if (alphabetLookup[character] === undefined)
      throw 'Value passed is not a valid Base58 string.'
    num += alphabetLookup[character] * columnValues[column++]
  }
  return num
}
