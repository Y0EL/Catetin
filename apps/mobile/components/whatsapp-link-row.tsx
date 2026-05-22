import { Check, Phone, Unlink } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native'
import { useStartPairing, useUnlinkWhatsapp, useWhatsappStatus } from '~/hooks/use-whatsapp'
import { apiErrorMessage } from '~/lib/api'
import { useAccentColor, useIsDark } from '~/lib/use-accent-color'

export function WhatsappLinkRow() {
  const accent = useAccentColor()
  const isDark = useIsDark()
  const [pairing, setPairing] = useState(false)
  const [phone, setPhone] = useState('')
  const status = useWhatsappStatus(pairing)
  const start = useStartPairing()
  const unlink = useUnlinkWhatsapp()

  const connected = status.data?.mode === 'connected'
  const pairingCode = start.data?.pairingCode ?? status.data?.pairingCode ?? null

  useEffect(() => {
    if (connected && pairing) setPairing(false)
  }, [connected, pairing])

  async function onSubmitPhone() {
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 8) {
      Alert.alert(
        'Nomor kurang valid',
        'Masukin nomor HP lo dengan kode negara, contoh: 628123456789',
      )
      return
    }
    setPairing(true)
    try {
      await start.mutateAsync(digits)
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
          setPhone('')
        },
      },
    ])
  }

  function onCancel() {
    setPairing(false)
    setPhone('')
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={connected ? 'Putusin WhatsApp' : 'Sambungin WhatsApp'}
        onPress={() => (connected ? onUnlink() : setPairing((v) => !v))}
        disabled={unlink.isPending}
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
        {unlink.isPending ? (
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
          {!pairingCode ? (
            <>
              <Text className="font-sans text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Masukkan nomor WhatsApp lo
              </Text>
              <Text className="mt-1 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                Format internasional, contoh: 628123456789
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="628123456789"
                placeholderTextColor="#a1a1aa"
                keyboardType="phone-pad"
                autoFocus
                className="mt-3 rounded-xl bg-white px-4 py-3 font-sans text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                style={{ borderWidth: 1, borderColor: isDark ? '#3f3f46' : '#e4e4e7' }}
              />
              <Pressable
                onPress={onSubmitPhone}
                disabled={start.isPending || phone.replace(/\D/g, '').length < 8}
                accessibilityRole="button"
                className="mt-3 items-center rounded-xl bg-primary-600 py-3 active:opacity-80 disabled:opacity-40"
              >
                {start.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="font-sans text-sm font-semibold text-white">Lanjut</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text className="font-sans text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                Kode pairing WhatsApp lo
              </Text>
              <Text className="mt-1 font-sans text-xs text-zinc-500 dark:text-zinc-400">
                Buka WA, Settings, Linked Devices, Link a Device, Link with Phone Number, masukkan
                kode ini.
              </Text>
              <View className="mt-4 items-center rounded-xl bg-white py-5 dark:bg-zinc-800">
                <Text
                  selectable
                  className="font-display text-4xl font-bold tracking-widest text-primary-600 dark:text-primary-300"
                >
                  {pairingCode}
                </Text>
              </View>
              <Text className="mt-2 text-center font-sans text-xs text-zinc-500 dark:text-zinc-400">
                Kode berlaku sekitar 60 detik
              </Text>
            </>
          )}

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
