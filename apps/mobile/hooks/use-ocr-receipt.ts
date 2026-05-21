import { useMutation } from '@tanstack/react-query'
import type { OcrReceiptResponse } from '@catetin/types'
import { apiFetch } from '~/lib/api'

export function useOcrReceipt() {
  return useMutation({
    mutationFn: async (input: { image: string; mimeType: string }) => {
      const res = await apiFetch<{ ok: true; draft: OcrReceiptResponse }>('/v1/ocr/receipt', {
        method: 'POST',
        body: JSON.stringify(input),
      })
      return res.draft
    },
  })
}
