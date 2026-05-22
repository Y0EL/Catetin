function pickIndonesianVoice(): SpeechSynthesisVoice | null {
  if (typeof speechSynthesis === 'undefined') return null
  const voices = speechSynthesis.getVoices()
  const id = voices.find((v) => v.lang.toLowerCase().startsWith('id'))
  if (id) return id
  return voices[0] ?? null
}

export function speakCompanionReply(text: string): void {
  if (typeof speechSynthesis === 'undefined' || typeof SpeechSynthesisUtterance === 'undefined') {
    return
  }
  try {
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    const voice = pickIndonesianVoice()
    if (voice) utter.voice = voice
    utter.lang = voice?.lang ?? 'id-ID'
    utter.rate = 1
    utter.pitch = 1
    speechSynthesis.speak(utter)
  } catch {
    // browser TTS bermasalah, abaikan
  }
}

export function cancelCompanionSpeech(): void {
  if (typeof speechSynthesis === 'undefined') return
  try {
    speechSynthesis.cancel()
  } catch {
    // browser TTS bermasalah, abaikan
  }
}
