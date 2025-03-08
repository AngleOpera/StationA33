import { BaseComponent, Component } from '@flamework/components'
import { OnStart } from '@flamework/core'
import { SpinTag } from 'ReplicatedStorage/shared/constants/tags'

@Component({ tag: SpinTag })
export class SpinComponent
  extends BaseComponent<{}, BasePart>
  implements OnStart
{
  onStart() {
    /*
sp = script.Parent

sp.Mesh.Scale = script.Parent.Size

while true do
sp.CFrame = sp.CFrame * CFrame.fromEulerAnglesXYZ(0, math.rad(0), 0.1)
wait(0.0001)
end
*/
  }
}
