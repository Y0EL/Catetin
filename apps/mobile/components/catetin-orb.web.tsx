import lottie, { type AnimationItem } from 'lottie-web'
import { useEffect, useRef } from 'react'
import orbSource from '../assets/lottie/orb.json'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: orbSource,
    })
    animRef.current = anim
    return () => {
      anim.destroy()
      animRef.current = null
    }
  }, [])

  useEffect(() => {
    animRef.current?.setSpeed(active ? 1.6 : 0.9)
  }, [active])

  return (
    <div
      role="button"
      aria-label={active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin'}
      onClick={onPress}
      ref={containerRef}
      style={{ width: size, height: size, cursor: 'pointer' }}
    />
  )
}
