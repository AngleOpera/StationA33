import { padEnd } from '@rbxts/string-utils'

// Based off MIT licensed https://github.com/jimeh/node-base58
export const base58Alphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'.split('')
export const base58AphabetSize = base58Alphabet.size()
export const base58AlphabetLookup = base58Alphabet.reduce(
  (lookup: Record<string, number>, char, index) => {
    lookup[char] = index
    return lookup
  },
  {},
)

export const base58ColumnValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0].map((_, i) =>
  math.pow(base58AphabetSize, i),
)

export function intToBase58(num: number): string {
  if (num < 0 || num !== num || math.floor(num) !== num) {
    throw 'Value passed is not a non-negative safe integer.'
  }
  let str = ''
  let modulus
  while (num >= base58AphabetSize) {
    modulus = num % base58AphabetSize
    str = base58Alphabet[modulus] + str
    num = math.floor(num / base58AphabetSize)
  }
  return base58Alphabet[num] + str
}

export function base58ToInt(str: string): number {
  let num = 0
  for (let i = str.size(), column = 0; i > 0; i--) {
    const character = str.sub(i, i)
    if (character === '_') continue
    if (base58AlphabetLookup[character] === undefined)
      throw 'Value passed is not a valid Base58 string.'
    num += base58AlphabetLookup[character] * base58ColumnValues[column++]
  }
  return num
}

export function encodeBase58Array(
  array: number[],
  encodedElementLength: number,
): string {
  let encodedArray = ''
  for (const n of array) {
    if (n < 0 || n > base58ColumnValues[encodedElementLength]) {
      throw `encodeBase58Array: ${n} invalid for length ${encodedElementLength}`
    }
    const encoded = intToBase58(n)
    encodedArray +=
      encoded.size() < encodedElementLength
        ? padEnd(encoded, encodedElementLength, '_')
        : encoded
  }
  return encodedArray
}

export function decodeBase58Array(
  encoded: string,
  length: number,
  encodedElementLength: number,
) {
  const decoded = []
  for (let i = 0; i < length; i++) {
    decoded.push(
      base58ToInt(
        encoded.sub(
          i * encodedElementLength + 1,
          (i + 1) * encodedElementLength,
        ),
      ),
    )
  }
  return decoded
}
