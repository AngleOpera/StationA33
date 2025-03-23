// Based off MIT licensed https://github.com/mafintosh/sorted-array-functions

export function compareNumber(a: number, b: number) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function compareString(a: string, b: string) {
  if (a === b) return 0
  return a < b ? -1 : 1
}

export function sarrayAdd<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  let top = list.push(value) - 1
  while (top) {
    if (cmp(list[top - 1], value) < 0) return
    list[top] = list[top - 1]
    list[top - 1] = value
    top--
  }
}

export function sarrayAddFromFront<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  const top = list.unshift(value) - 1
  for (let i = 0; i < top; i++) {
    if (cmp(value, list[i + 1]) < 0) return
    list[i] = list[i + 1]
    list[i + 1] = value
  }
}

export function sarrayFindLessThanEqual<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  let i = sarrayIndexOf(list, value, cmp)
  if (i === -1) return -1
  for (; i >= 0; i--) {
    const c = cmp(list[i], value)
    if (c <= 0) return i
  }
  return -1
}

export function sarrayFindLessThan<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  let i = sarrayIndexOf(list, value, cmp)
  if (i === -1) return -1
  for (; i >= 0; i--) {
    const c = cmp(list[i], value)
    if (c < 0) return i
  }
  return -1
}

export function sarrayFindGreaterThanEqual<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  let i = sarrayIndexOf(list, value, cmp)
  if (i === -1) return -1
  for (; i < list.size(); i++) {
    const c = cmp(list[i], value)
    if (c >= 0) return i
  }
  return -1
}

export function sarrayFindGreaterThan<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  let i = sarrayIndexOf(list, value, cmp)
  if (i === -1) return -1
  for (; i < list.size(); i++) {
    const c = cmp(list[i], value)
    if (c > 0) return i
  }
  return -1
}

export function sarrayFind<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  const i = sarrayIndexOf(list, value, cmp)
  if (i === -1) return -1
  return cmp(list[i], value) === 0 ? i : -1
}

export function sarrayIndexOf<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  const len = list.size()
  let top = len - 1
  let btm = 0
  let mid = -1
  while (top >= btm && btm >= 0 && top < len) {
    mid = math.floor((top + btm) / 2)
    const c = cmp(list[mid], value)
    if (c === 0) return mid
    if (c >= 0) top = mid - 1
    else btm = mid + 1
  }
  return mid
}

export function sarrayHas<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  return sarrayFind(list, value, cmp) > -1
}

export function sarrayRemove<X extends defined>(
  list: X[],
  value: X,
  cmp: (a: X, b: X) => number,
) {
  const i = sarrayFind(list, value, cmp)
  if (i === -1) return false
  list.remove(i)
  return true
}
