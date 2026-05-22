import { Check, Phone, Unlink } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, Text, View } from 'react-native'
import { useStartPairing, useUnlinkWhatsapp, useWhatsappStatus } from '~/hooks/use-whatsapp'
import { apiErrorMessage } from '~/lib/api'
import { useAccentColor } from '~/lib/use-accent-color'

export function WhatsappLinkRow() {
  const accent = useAccentColor()
  const [pairing, setPairing] = useState(false)
  const status = useWhatsappStatus(pairing)
  const start = useStartPairing()
  const unlink = useUnlinkWhatsapp()

  const connected = status.data?.mode === 'connected'
  const qr = status.data?.qr ?? start.data?.qr ?? null

  useEffect(() => {
    if (connected && pairing) setPairing(false)
  }, [connected, pairing])

  async function onStart() {
    setPairing(true)
    try {
      await start.mutateAsync()
    } catch (err) {
      setPairing(false)
      Alert.alert('Gak bisa mulai', apiErrorMessage(err))
    }
  }

  function onUnlink() {
    Alert.alert('Putusin WhatsApp', 'WhatsApp lo bakal dicabut dari Catetin. Yakin?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Putusin',
        style: 'destructive',
        onPress: () => {
          unlink.mutate()
          setPairing(false)
        },
      },
    ])
  }

  function onCancel() {
    setPairing(false)
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={connected ? 'Putusin WhatsApp' : 'Sambungin WhatsApp'}
        onPress={() => (connected ? onUnlink() : onStart())}
        disabled={start.isPending || unlink.isPending}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Phone size={18} color={accent} />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">WhatsApp</Text>
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
            Catat lewat chat ke diri sendiri
          </Text>
        </View>
        {start.isPending || unlink.isPending ? (
          <ActivityIndicator size="small" color={accent} />
        ) : connected ? (
          <View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2.5 py-1">
            <Check size={12} color="#16a34a" />
            <Text className="font-sans text-xs font-semibold text-success">Tersambung</Text>
          </View>
        ) : (
          <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-200">
            Sambungin
          </Text>
        )}
      </Pressable>

      {pairing && !connected ? (
        <View className="mx-4 mb-4 rounded-card bg-primary-50 p-4 dark:bg-primary-950">
          <Text className="font-sans text-xs text-zinc-600 dark:text-zinc-300">
            Buka WhatsApp lo, masuk Settings, Linked Devices, Link a Device, scan QR di bawah ini.
          </Text>
          <View className="mt-3 items-center rounded-xl bg-white p-4 dark:bg-zinc-800">
            {qr ? (
              <Image
                source={{ uri: qr }}
                style={{ width: 240, height: 240 }}
                accessibilityLabel="QR code untuk scan"
              />
            ) : (
              <View className="h-[240px] w-[240px] items-center justify-center">
                <ActivityIndicator size="small" color={accent} />
                <Text className="mt-3 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                  Lagi nyiapin QR
                </Text>
              </View>
            )}
          </View>
          <Text className="mt-3 text-center font-sans text-xs text-zinc-500 dark:text-zinc-400">
            QR auto refresh, scan secepat mungkin
          </Text>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel="Batal pairing"
            className="mt-3 flex-row items-center justify-center gap-2 rounded-xl border border-zinc-200 py-3 active:opacity-80 dark:border-zinc-700"
          >
            <Unlink size={14} color={accent} />
            <Text className="font-sans text-sm font-semibold text-zinc-700 dark:text-zinc-200">
              Batal
            </Text>
          </Pressable>
        </View>
      ) : null}

      {start.isError ? (
        <Text className="mx-4 mb-3 font-sans text-xs text-danger">
          {apiErrorMessage(start.error)}
        </Text>
      ) : null}
    </View>
  )
}
