import { useCallback, useRef } from 'react'

export type RecordedAudio = { base64: string; mimeType: string }

export type CompanionRecorder = {
  start(): Promise<void>
  stop(): Promise<RecordedAudio>
  cancel(): void
}

function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  for (const mime of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) return mime
  }
  return 'audio/webm'
}

function normalizeMime(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('ogg')) return 'audio/ogg'
  if (lower.includes('webm')) return 'audio/webm'
  if (lower.includes('mp4') || lower.includes('m4a')) return 'audio/mp4'
  if (lower.includes('wav')) return 'audio/wav'
  return raw.split(';')[0] ?? 'audio/webm'
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : '')
    }
    reader.onerror = () => reject(reader.error ?? new Error('Gagal baca audio'))
    reader.readAsDataURL(blob)
  })
}

export function useCompanionRecorder() {
  const recRef = useRef<CompanionRecorder | null>(null)

  const start = useCallback(async () => {
    const rec = createCompanionRecorder()
    await rec.start()
    recRef.current = rec
  }, [])

  const stop = useCallback(async (): Promise<RecordedAudio> => {
    const rec = recRef.current
    if (!rec) throw new Error('Gak lagi rekam')
    recRef.current = null
    return rec.stop()
  }, [])

  const cancel = useCallback(() => {
    recRef.current?.cancel()
    recRef.current = null
  }, [])

  return { start, stop, cancel }
}

export function createCompanionRecorder(): CompanionRecorder {
  let recorder: MediaRecorder | null = null
  let stream: MediaStream | null = null
  let chunks: Blob[] = []
  let mimeType = 'audio/webm'

  function cleanup() {
    if (stream) {
      for (const track of stream.getTracks()) track.stop()
      stream = null
    }
    recorder = null
    chunks = []
  }

  return {
    async start() {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        throw new Error('Browser lo gak support recording mic.')
      }
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mimeType = pickMimeType()
      const rec = new MediaRecorder(stream, { mimeType })
      chunks = []
      rec.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data)
      }
      rec.start()
      recorder = rec
    },
    async stop(): Promise<RecordedAudio> {
      const rec = recorder
      if (!rec) throw new Error('Gak lagi rekam')
      const done = new Promise<Blob>((resolve, reject) => {
        rec.onstop = () => resolve(new Blob(chunks, { type: mimeType }))
        rec.onerror = (ev) => reject((ev as ErrorEvent).error ?? new Error('Recording error'))
      })
      rec.stop()
      const blob = await done
      const base64 = await blobToBase64(blob)
      cleanup()
      return { base64, mimeType: normalizeMime(mimeType) }
    },
    cancel() {
      try {
        if (recorder && recorder.state !== 'inactive') recorder.stop()
      } catch {
        // already stopped
      }
      cleanup()
    },
  }
}
