import { useMemo } from 'react'
import { Orb, type AgentState } from './orb-3d.web'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const agentState: AgentState = active ? 'listening' : null
  const colors = useMemo<[string, string]>(() => ['#9b72cb', '#4285f4'], [])

  return (
    <div
      role="button"
      aria-label={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onClick={onPress}
      style={{ width: size, height: size, cursor: 'pointer' }}
    >
      <Orb colors={colors} agentState={agentState} />
    </div>
  )
}
