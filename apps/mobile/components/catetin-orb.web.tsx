import { useEffect } from 'react'

type Props = {
  size?: number
  active?: boolean
  onPress?: () => void
}

const STYLE_ID = 'catetin-orb-css'

function ensureStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const el = document.createElement('style')
  el.id = STYLE_ID
  el.textContent = `
    @keyframes orb-b1 {
      0%,100% { transform: translate(-18%,-22%) scale(1.0); }
      25%      { transform: translate(22%,-35%) scale(1.18); }
      50%      { transform: translate(12%,18%) scale(0.88); }
      75%      { transform: translate(-24%,12%) scale(1.08); }
    }
    @keyframes orb-b2 {
      0%,100% { transform: translate(22%,18%) scale(0.92); }
      30%     { transform: translate(-18%,28%) scale(1.12); }
      60%     { transform: translate(-22%,-22%) scale(1.0); }
      85%     { transform: translate(18%,-18%) scale(0.88); }
    }
    @keyframes orb-b3 {
      0%,100% { transform: translate(-12%,28%) scale(1.06); }
      35%     { transform: translate(24%,-18%) scale(0.88); }
      70%     { transform: translate(-22%,-12%) scale(1.12); }
    }
    @keyframes orb-b4 {
      0%,100% { transform: translate(14%,-28%) scale(0.88); }
      40%     { transform: translate(-28%,18%) scale(1.1); }
      75%     { transform: translate(22%,22%) scale(1.0); }
    }
    @keyframes orb-glow {
      0%,100% { box-shadow: 0 0 20px 4px rgba(255,255,255,0.18), 0 0 48px 12px rgba(139,92,246,0.07); }
      50%     { box-shadow: 0 0 32px 8px rgba(255,255,255,0.30), 0 0 72px 20px rgba(139,92,246,0.11); }
    }
  `
  document.head.appendChild(el)
}

export function CatetinOrb({ size = 250, active = false, onPress }: Props) {
  useEffect(() => {
    ensureStyles()
  }, [])

  const speed = active ? 0.45 : 1
  const blobSize = size * 0.68

  // Outer div: just the glow ring animation (box-shadow). No clip here.
  const outer: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    position: 'relative',
    cursor: onPress ? 'pointer' : 'default',
    flexShrink: 0,
    animationName: 'orb-glow',
    animationDuration: `${4 * speed}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  }

  // Inner div: white sphere that clips the blobs.
  // CSS mask is more reliable than overflow:hidden when children use filter:blur.
  const inner: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    WebkitMaskImage: 'radial-gradient(circle closest-side, black 96%, transparent 100%)',
    maskImage: 'radial-gradient(circle closest-side, black 96%, transparent 100%)',
  }

  const blob = (
    color: string,
    w: number,
    top: string | undefined,
    left: string | undefined,
    bottom: string | undefined,
    right: string | undefined,
    anim: string,
    dur: number,
    delay: number,
  ): React.CSSProperties => ({
    position: 'absolute',
    width: w,
    height: w,
    borderRadius: '50%',
    backgroundColor: color,
    filter: `blur(${Math.round(w * 0.3)}px)`,
    top,
    left,
    bottom,
    right,
    animationName: anim,
    animationDuration: `${dur * speed}s`,
    animationDelay: `${delay * speed}s`,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    willChange: 'transform',
    opacity: 0.38,
  })

  return (
    <div
      style={outer}
      onClick={onPress}
      role={onPress ? 'button' : undefined}
      aria-label={
        onPress ? (active ? 'Hentikan obrolan' : 'Mulai ngobrol dengan Catetin') : undefined
      }
    >
      <div style={inner}>
        <div style={blob('#6366f1', blobSize, '6%', '2%', undefined, undefined, 'orb-b1', 9, 0)} />
        <div
          style={blob(
            '#8b5cf6',
            blobSize * 0.88,
            '28%',
            undefined,
            undefined,
            '2%',
            'orb-b2',
            11,
            -2,
          )}
        />
        <div
          style={blob(
            '#3b82f6',
            blobSize * 0.74,
            undefined,
            '10%',
            '4%',
            undefined,
            'orb-b3',
            13,
            -4,
          )}
        />
        <div
          style={blob(
            '#ec4899',
            blobSize * 0.58,
            '12%',
            undefined,
            undefined,
            '18%',
            'orb-b4',
            7.5,
            -1,
          )}
        />
      </div>
    </div>
  )
}
