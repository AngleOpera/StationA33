import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import {
  BLOCK_ATTRIBUTE,
  MATERIAL_LOOKUP,
} from 'ReplicatedStorage/shared/constants/core'
import { DoorTag } from 'ReplicatedStorage/shared/constants/tags'
import { findDescendentsWhichAre } from 'ReplicatedStorage/shared/utils/instance'

@Component({ tag: DoorTag })
export class DoorComponent extends BaseComponent<{}, Door> implements OnStart {
  onStart() {
    this.instance.ClickDetector.MouseHoverEnter.Connect(() => {
      findDescendentsWhichAre<BasePart>(this.instance, 'BasePart').forEach(
        (part) => {
          part.SetAttribute(BLOCK_ATTRIBUTE.OriginalColor, part.Color)
          part.SetAttribute(
            BLOCK_ATTRIBUTE.OriginalMaterial,
            part.Material.Name,
          )
          part.Color = Color3.fromRGB(0, 255, 0)
          part.Material = Enum.Material.Neon
        },
      )
    })
    this.instance.ClickDetector.MouseHoverLeave.Connect(() => {
      findDescendentsWhichAre<BasePart>(this.instance, 'BasePart').forEach(
        (part) => {
          const originalColor = part.GetAttribute(BLOCK_ATTRIBUTE.OriginalColor)
          const originalMaterial = part.GetAttribute(
            BLOCK_ATTRIBUTE.OriginalMaterial,
          )
          if (originalColor && typeIs(originalColor, 'Color3')) {
            part.Color = originalColor
          }
          if (originalMaterial && typeIs(originalMaterial, 'string')) {
            const material = MATERIAL_LOOKUP[originalMaterial]
            if (material) part.Material = material
          }
        },
      )
    })
    this.instance.ClickDetector.MouseClick.Connect(() => {
      // print('open door')
    })
  }
}
