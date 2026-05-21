import { ExternalLink, MessageCircle } from 'lucide-react-native'
import { ActivityIndicator, Linking, Pressable, Text, View } from 'react-native'
import { useLinkTelegram } from '~/hooks/use-link-telegram'
import { apiErrorMessage } from '~/lib/api'

export function TelegramLinkRow() {
  const link = useLinkTelegram()
  const data = link.data

  function onOpen() {
    if (!data) return
    Linking.openURL(data.telegramUrl).catch(() => {})
  }

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sambungin Telegram"
        onPress={() => link.mutate()}
        disabled={link.isPending}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <MessageCircle size={18} color="#18181b" />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">Telegram</Text>
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
            @catetindobot
          </Text>
        </View>
        {link.isPending ? (
          <ActivityIndicator size="small" color="#18181b" />
        ) : (
          <Text className="font-sans text-sm font-semibold text-primary-600">
            {data ? 'Kode baru' : 'Sambungin'}
          </Text>
        )}
      </Pressable>

      {data ? (
        <View className="mx-4 mb-4 rounded-card bg-primary-50 p-4 dark:bg-primary-950">
          <Text className="font-sans text-xs text-zinc-600 dark:text-zinc-300">
            Tap tombol di bawah, nanti Telegram kebuka dan kodenya otomatis kekirim. Atau ketik
            manual ke @catetindobot.
          </Text>
          <View className="mt-3 items-center rounded-xl bg-white px-4 py-3 dark:bg-zinc-900">
            <Text className="font-display text-2xl font-bold tracking-[8px] text-primary-700 dark:text-primary-200">
              {data.code}
            </Text>
          </View>
          <Pressable
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel="Buka Telegram"
            className="mt-3 flex-row items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 active:opacity-90"
          >
            <ExternalLink size={16} color="#ffffff" />
            <Text className="font-sans text-sm font-semibold text-white">Buka Telegram</Text>
          </Pressable>
          <Text className="mt-3 text-center font-sans text-xs text-zinc-500 dark:text-zinc-400">
            Kode berlaku 15 menit.
          </Text>
        </View>
      ) : null}

      {link.isError ? (
        <Text className="mx-4 mb-3 font-sans text-xs text-danger">
          {apiErrorMessage(link.error)}
        </Text>
      ) : null}
    </View>
  )
}
