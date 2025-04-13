import { hoarcekat } from '@rbxts/pretty-react-hooks'
import React from '@rbxts/react'
import { RootProvider } from 'StarterPlayer/StarterPlayerScripts/Gui/providers/RootProvider'
import { GameLog } from 'StarterPlayer/StarterPlayerScripts/Gui/sections/GameLog'

export = hoarcekat(() => {
  return (
    <RootProvider>
      <GameLog
        log={[
          { message: 'You mined one Ruby Ore', expires: time() + 100 },
          { message: 'You mined one Ruby Ore', expires: time() + 100 },
          {
            message: 'AngleOpera was teleported by CreeperFace77777',
            expires: time() + 100,
          },
          { message: 'You mined one Ruby Ore', expires: time() + 100 },
          { message: 'You mined one Ruby Ore', expires: time() + 100 },
        ]}
        visible={true}
      />
    </RootProvider>
  )
})
