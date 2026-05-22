import { useCallback, useRef } from 'react'
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder } from 'expo-audio'
import type { RecordingOptions } from 'expo-audio'
import * as FileSystem from 'expo-file-system/legacy'

export type RecordedAudio = { base64: string; mimeType: string }

export function useCompanionRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY as RecordingOptions)
  const ready = useRef(false)

  const start = useCallback(async () => {
    if (!ready.current) {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync()
      if (!granted) throw new Error('Izin mikrofon ditolak.')
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true })
      ready.current = true
    }
    await recorder.prepareToRecordAsync()
    recorder.record()
  }, [recorder])

  const stop = useCallback(async (): Promise<RecordedAudio> => {
    await recorder.stop()
    const uri = recorder.uri
    if (!uri) throw new Error('Rekaman kosong.')
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })
    return { base64, mimeType: 'audio/m4a' }
  }, [recorder])

  const cancel = useCallback(() => {
    try {
      recorder.stop()
    } catch {
      // recorder already stopped
    }
  }, [recorder])

  return { start, stop, cancel }
}
