// Walk seluruh node Lottie JSON dan ganti tiap nilai color (c.k) ke RGB target.
// Bekerja buat lottie-react-native (native) maupun lottie-web (SVG).
type Vec3 = [number, number, number]

export function tintLottie(src: unknown, color: Vec3): unknown {
  return walk(src, color)
}

function walk(node: unknown, color: Vec3): unknown {
  if (Array.isArray(node)) return node.map((n) => walk(n, color))
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'c' && v && typeof v === 'object' && 'k' in (v as Record<string, unknown>)) {
        out.c = replaceColor(v as Record<string, unknown>, color)
      } else {
        out[k] = walk(v, color)
      }
    }
    return out
  }
  return node
}

function replaceColor(cObj: Record<string, unknown>, color: Vec3): Record<string, unknown> {
  const next: Record<string, unknown> = { ...cObj }
  const k = cObj.k
  if (Array.isArray(k)) {
    if (typeof k[0] === 'number') {
      const alpha = typeof k[3] === 'number' ? k[3] : 1
      next.k = [color[0], color[1], color[2], alpha]
    } else {
      next.k = (k as Array<Record<string, unknown>>).map((kf) => {
        const nk: Record<string, unknown> = { ...kf }
        if (Array.isArray(kf.s) && (kf.s as unknown[]).length >= 3) {
          const arr = kf.s as number[]
          const a = typeof arr[3] === 'number' ? arr[3] : 1
          nk.s = [color[0], color[1], color[2], a]
        }
        if (Array.isArray(kf.e) && (kf.e as unknown[]).length >= 3) {
          const arr = kf.e as number[]
          const a = typeof arr[3] === 'number' ? arr[3] : 1
          nk.e = [color[0], color[1], color[2], a]
        }
        return nk
      })
    }
  }
  return next
}
