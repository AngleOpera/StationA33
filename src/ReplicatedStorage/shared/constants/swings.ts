export interface Swing {
  name: string
  duration: number
  baseDamage?: number
  r15animation?: Animation
  r15animationId: number
  soundName?: string
  sound?: Sound
}

export type SwingName = 'Left' | 'Lunge' | 'PickAxe' | 'Right' | 'Slash'

export const SWINGS: Record<SwingName, Swing> = {
  PickAxe: {
    name: 'PickAxe',
    duration: 1,
    r15animationId: 704173649,
  },
  Slash: {
    name: 'Slash',
    duration: 0.75,
    r15animationId: 522635514,
    baseDamage: 85,
  },
  Left: {
    name: 'Left',
    duration: 0.75,
    r15animationId: 17734827634,
    baseDamage: 97,
    soundName: 'SwordSlash',
  },
  Lunge: {
    name: 'Lunge',
    duration: 0.75,
    r15animationId: 522638767,
    baseDamage: 105,
    soundName: 'SwordSlash',
  },
  Right: {
    name: 'Right',
    duration: 0.75,
    r15animationId: 17734841566,
    baseDamage: 90,
    soundName: 'SwordLunge',
  },
}

export const SWINGS_LOOKUP = SWINGS as Partial<Record<string, Swing>>
