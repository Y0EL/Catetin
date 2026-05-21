import lottie, { type AnimationItem } from 'lottie-web'
import { useEffect, useRef } from 'react'
import loadingSource from '../assets/lottie/loading.json'

type Props = { size?: number }

export function LoadingLottie({ size = 120 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const animRef = useRef<AnimationItem | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: loadingSource,
    })
    animRef.current = anim
    return () => {
      anim.destroy()
      animRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={{ width: size, height: size }} />
}
