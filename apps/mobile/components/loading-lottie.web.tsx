import lottie, { type AnimationItem } from 'lottie-web'
import { useEffect, useRef } from 'react'
import loadingSource from '../assets/lottie/loading.json'
import { tintLottie } from './lottie-tint'

const blackSource = tintLottie(loadingSource, [0, 0, 0])

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
      animationData: blackSource as object,
    })
    animRef.current = anim
    return () => {
      anim.destroy()
      animRef.current = null
    }
  }, [])

  return <div ref={containerRef} style={{ width: size, height: size }} />
}
