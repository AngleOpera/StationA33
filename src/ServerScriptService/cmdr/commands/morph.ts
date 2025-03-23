import { CommandDefinition } from '@rbxts/cmdr'

export = identity<CommandDefinition>({
  Name: 'morph',
  Description: 'Morph player character',
  Group: 'Admin',
  Args: [
    {
      Type: 'player',
      Name: 'player',
      Description: 'Player',
    },
    {
      Type: 'morph',
      Name: 'Morph',
      Description: 'Morph',
    },
  ],
})
