import { lerpBinding, useEventListener } from '@rbxts/pretty-react-hooks'
import React, { useEffect, useState } from '@rbxts/react'
import { setTimeout } from '@rbxts/set-timeout'
import { springs } from 'StarterPlayer/StarterPlayerScripts/constants/springs'
import { useController } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useController'
import { useMotion } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useMotion'
import { useRem } from 'StarterPlayer/StarterPlayerScripts/Gui/hooks/useRem'
import { Events } from 'StarterPlayer/StarterPlayerScripts/network'

interface GameLogEntry {
  message: string
  expires: number
}

const messageDuration = 3

const updateGameLog =
  (now: number, message?: string) =>
  (arr: Array<GameLogEntry>): Array<GameLogEntry> => [
    ...(message ? [{ message, expires: now + messageDuration }] : []),
    ...arr.filter((x) => x.expires > now),
  ]

const updateCancelTimer =
  (newCallback: () => void, timeout: number) =>
  (cancelTimer: (() => void) | undefined) => {
    if (cancelTimer) cancelTimer()
    return setTimeout(newCallback, timeout)
  }

export function GameLog(props: { log?: GameLogEntry[]; visible?: boolean }) {
  const controller = useController()
  const rem = useRem()
  const font = new Font(
    'rbxasset://fonts/families/BuilderSans.json',
    Enum.FontWeight.Medium,
    Enum.FontStyle.Normal,
  )
  const [transition, transitionMotion] = useMotion(0)
  const [visible, setVisible] = useState(!!props.visible)
  const [_cancelTimer, setCancelTimer] = useState<(() => void) | undefined>(
    undefined,
  )
  const [log, setLog] = useState<GameLogEntry[]>(props.log ?? [])
  const logHeight = rem(2)
  const maxLogLines = 6
  const maxLogHeight = logHeight * maxLogLines

  useEffect(
    () => transitionMotion.spring(visible ? 1 : 0, springs.gentle),
    [visible],
  )

  useEventListener(Events.message, (messageType, content, _duration) => {
    if (messageType !== 'log') return

    let message = ''
    for (const x of content) {
      const value =
        !x.type || x.type === 'key'
          ? controller.playerController?.translateByKey(x.value)
          : x.value
      if (value) message += (message.size() ? ' ' : '') + `${value}`
    }
    setLog(updateGameLog(time(), message))

    // Fade in
    setVisible(true)

    // Then fade out
    setCancelTimer(updateCancelTimer(() => setVisible(false), messageDuration))
  })

  return (
    <frame
      key="GameLogContainer"
      BackgroundTransparency={1}
      BorderSizePixel={0}
      ClipsDescendants={true}
      AnchorPoint={new Vector2(0, 1)}
      Position={new UDim2(0.77, 0, 1, -rem(6))}
      Size={new UDim2(0.25, 0, 0, maxLogHeight)}
    >
      <uipadding PaddingBottom={new UDim(0, rem(1))} />
      {log
        .filter((_entry, i) => i < maxLogLines)
        .map((entry, i) => (
          <frame
            BackgroundTransparency={1}
            Size={new UDim2(1, 0, 0, logHeight)}
            Position={UDim2.fromOffset(0, (maxLogLines - 1 - i) * logHeight)}
          >
            <frame
              key="Content"
              BackgroundTransparency={1}
              Size={UDim2.fromScale(1, 1)}
            >
              <textlabel
                key={'LogText'}
                FontFace={font}
                Text={`${entry.message}`}
                TextColor3={Color3.fromRGB(
                  255 - i * 32,
                  255 - i * 32,
                  255 - i * 32,
                )}
                TextSize={15}
                TextTruncate={Enum.TextTruncate.AtEnd}
                TextTransparency={lerpBinding(transition, 1, 0)}
                TextXAlignment={Enum.TextXAlignment.Left}
                Active={true}
                BackgroundTransparency={1}
                Size={UDim2.fromScale(1, 1)}
              >
                <uipadding PaddingLeft={new UDim(0, 4)} />
              </textlabel>
            </frame>
          </frame>
        ))}
    </frame>
  )
}
