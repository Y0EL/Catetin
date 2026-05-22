import { useCallback, useState } from 'react'

let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext()
  return audioCtx
}

export function useCompanionTts() {
  const [playing, setPlaying] = useState(false)

  const play = useCallback(async (base64Wav: string) => {
    setPlaying(true)
    try {
      await playTtsAudio(base64Wav)
    } finally {
      setPlaying(false)
    }
  }, [])

  const stop = useCallback(() => {
    stopTtsAudio()
    setPlaying(false)
  }, [])

  return { play, stop, playing }
}

export async function playTtsAudio(base64Wav: string): Promise<void> {
  stopTtsAudio()
  const ctx = getCtx()
  if (ctx.state === 'suspended') await ctx.resume()
  const bytes = Uint8Array.from(atob(base64Wav), (c) => c.charCodeAt(0))
  const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0))
  return new Promise((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.connect(ctx.destination)
    source.onended = () => {
      currentSource = null
      resolve()
    }
    currentSource = source
    source.start()
  })
}

export function stopTtsAudio(): void {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {
      // already stopped
    }
    currentSource = null
  }
}
