import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { Platform } from 'react-native'
import { getCurrentIdToken } from '~/lib/auth'

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000'

async function fetchReport(path: string): Promise<Blob> {
  const token = await getCurrentIdToken()
  const res = await fetch(`${BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.blob()
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') return reject(new Error('FileReader empty'))
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

function triggerWebDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function downloadAndShareReport(kind: 'pdf' | 'csv', month: string): Promise<void> {
  const path = `/v1/reports/${kind}?month=${month}`
  const blob = await fetchReport(path)
  const filename = `catetin-${month}.${kind}`

  if (Platform.OS === 'web') {
    triggerWebDownload(blob, filename)
    return
  }

  const base64 = await blobToBase64(blob)
  const fileUri = `${FileSystem.cacheDirectory}${filename}`
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, {
      mimeType: kind === 'pdf' ? 'application/pdf' : 'text/csv',
      dialogTitle: `Catetin ${kind.toUpperCase()} ${month}`,
    })
  }
}
