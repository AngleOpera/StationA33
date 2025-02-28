export const endsWith = (str: string, suffix: string) =>
  str.sub(str.size() - suffix.size()) === suffix

export const getLastItem = <X>(array: X[]) => array[array.size() - 1]

export function randomElement<T extends defined>(array: T[]): T {
  const random = new Random()
  const randomIndex = random.NextInteger(0, array.size() - 1)
  return array[randomIndex]
}

export function shuffle<T extends defined>(
  array: T[],
  random = new Random(),
): T[] {
  const result = table.clone(array)
  for (const index of $range(result.size() - 1, 1, -1)) {
    const randomIndex = random.NextInteger(0, index)
    const temp = result[index]
    result[index] = result[randomIndex]
    result[randomIndex] = temp
  }
  return result
}
