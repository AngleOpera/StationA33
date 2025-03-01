export const accents = {
  red: Color3.fromRGB(250, 47, 0),
  orange: Color3.fromRGB(246, 99, 0),
  grass: Color3.fromRGB(126, 184, 19),
  green: Color3.fromRGB(41, 240, 17),
  lime: Color3.fromRGB(27, 255, 60),
  sky: Color3.fromRGB(0, 203, 250),
  blue: Color3.fromRGB(0, 147, 246),
  purple: Color3.fromRGB(88, 30, 184),
  pink: Color3.fromRGB(255, 27, 222),
  magenta: Color3.fromRGB(216, 17, 240),
} as const

export const neutrals = {
  text: Color3.fromRGB(234, 234, 234),
  base: Color3.fromRGB(30, 30, 46),
} as const

const base = {
  white: Color3.fromRGB(255, 255, 255),
  black: Color3.fromRGB(0, 0, 0),
}

export const palette = {
  ...accents,
  ...neutrals,
  ...base,
} as const
