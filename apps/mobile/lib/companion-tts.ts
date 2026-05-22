import { useCallback, useEffect, useRef, useState } from 'react'
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'

const TTS_DIR = (FileSystem.cacheDirectory ?? '') + 'cmp_tts_'

export function useCompanionTts() {
  const ctr = useRef(0)
  const [uri, setUri] = useState<string | null>(null)
  const player = useAudioPlayer(uri)
  const status = useAudioPlayerStatus(player)
  const [playing, setPlaying] = useState(false)
  const wasPlayingRef = useRef(false)

  useEffect(() => {
    if (!uri) return
    const t = setTimeout(() => player.play(), 150)
    return () => clearTimeout(t)
  }, [uri, player])

  useEffect(() => {
    if (wasPlayingRef.current && !status.playing) {
      setPlaying(false)
    }
    wasPlayingRef.current = status.playing ?? false
  }, [status.playing])

  const play = useCallback(async (base64Wav: string) => {
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false })
    ctr.current++
    const path = `${TTS_DIR}${ctr.current}.wav`
    await FileSystem.writeAsStringAsync(path, base64Wav, {
      encoding: FileSystem.EncodingType.Base64,
    })
    wasPlayingRef.current = false
    setPlaying(true)
    setUri(path)
  }, [])

  const stop = useCallback(() => {
    try {
      player.pause()
    } catch {
      // player already stopped
    }
    wasPlayingRef.current = false
    setPlaying(false)
  }, [player])

  return { play, stop, playing }
}
