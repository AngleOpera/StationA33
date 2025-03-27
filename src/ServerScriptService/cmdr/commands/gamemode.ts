import { CommandDefinition } from '@rbxts/cmdr'

export = identity<CommandDefinition>({
  Name: 'gamemode',
  Description: 'Change player gamemode',
  Group: 'Admin',
  Args: [
    {
      Type: 'player',
      Name: 'player',
      Description: 'Player',
    },
    {
      Type: 'gamemode',
      Name: 'Gamemode',
      Description: 'Game mode',
    },
  ],
})
