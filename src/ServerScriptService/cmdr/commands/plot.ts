import { CommandDefinition } from '@rbxts/cmdr'

export = identity<CommandDefinition>({
  Name: 'plot',
  Description: 'Admin plot',
  Group: 'Admin',
  Args: [
    {
      Type: 'player',
      Name: 'player',
      Description: 'Player',
    },
    {
      Type: 'plotCommand',
      Name: 'command',
      Description: 'Command',
    },
  ],
})
