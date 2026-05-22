export type RecordedAudio = { base64: string; mimeType: string }

export type CompanionRecorder = {
  start(): Promise<void>
  stop(): Promise<RecordedAudio>
  cancel(): void
}

export function createCompanionRecorder(): CompanionRecorder {
  return {
    async start() {
      throw new Error('Voice belum aktif di mobile native, sementara pakai versi web dulu.')
    },
    async stop() {
      throw new Error('Voice belum aktif di mobile native.')
    },
    cancel() {},
  }
}
