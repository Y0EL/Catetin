import { useRouter } from 'expo-router'
import { Check, X } from 'lucide-react-native'
import { useColorScheme } from 'nativewind'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CatetinOrb } from '~/components/catetin-orb'
import { useSubscription } from '~/hooks/use-subscription'
import { useT } from '~/lib/lang-context'
import {
  getCurrentOffering,
  pickPackage,
  purchasePackage,
  restorePurchases,
} from '~/lib/revenuecat'

export default function PaywallScreen() {
  const router = useRouter()
  const { colorScheme } = useColorScheme()
  const isDark = colorScheme === 'dark'
  const { isPro } = useSubscription()
  const t = useT()
  const [buying, setBuying] = useState(false)
  const [restoring, setRestoring] = useState(false)

  const FEATURES = [
    { title: t('paywall_f1_title'), desc: t('paywall_f1_desc') },
    { title: t('paywall_f2_title'), desc: t('paywall_f2_desc') },
    { title: t('paywall_f3_title'), desc: t('paywall_f3_desc') },
    { title: t('paywall_f4_title'), desc: t('paywall_f4_desc') },
    { title: t('paywall_f5_title'), desc: t('paywall_f5_desc') },
    { title: t('paywall_f6_title'), desc: t('paywall_f6_desc') },
  ]

  async function onBuy() {
    if (buying) return
    setBuying(true)
    try {
      const offering = await getCurrentOffering()
      const pkg = pickPackage(offering, 'monthly')
      if (!pkg) {
        Alert.alert(t('paywall_not_available_title'), t('paywall_not_available_body'))
        return
      }
      const result = await purchasePackage(pkg)
      if (result.ok) {
        router.back()
      } else if (!result.userCancelled) {
        Alert.alert(t('common_error'), result.message)
      }
    } finally {
      setBuying(false)
    }
  }

  async function onRestore() {
    if (restoring) return
    setRestoring(true)
    try {
      const result = await restorePurchases()
      if (result.ok) {
        Alert.alert(t('paywall_restored_title'), t('paywall_restored_body'), [
          { text: t('paywall_continue'), onPress: () => router.back() },
        ])
      } else {
        Alert.alert(t('paywall_not_found_title'), t('paywall_not_found_body'))
      }
    } finally {
      setRestoring(false)
    }
  }

  if (isPro) {
    return (
      <SafeAreaView
        className="flex-1 bg-white dark:bg-zinc-950 items-center justify-center px-6"
        edges={['top', 'bottom']}
      >
        <View className="items-center gap-6">
          <CatetinOrb size={140} active={false} />
          <View className="items-center gap-2">
            <Text className="font-display text-2xl font-bold text-zinc-950 dark:text-white text-center">
              {t('paywall_already_pro_title')}
            </Text>
            <Text className="font-sans text-sm text-zinc-500 text-center leading-5">
              {t('paywall_already_pro_body')}
            </Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            className="rounded-full bg-primary-600 px-8 py-3.5 active:opacity-90"
          >
            <Text className="font-sans text-base font-semibold text-white">{t('common_back')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    )
  }

  const featurePairs: (typeof FEATURES)[] = []
  for (let i = 0; i < FEATURES.length; i += 2) {
    featurePairs.push(FEATURES.slice(i, i + 2))
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950" edges={['top', 'bottom']}>
      <View className="flex-row justify-end px-4 pt-3">
        <Pressable
          onPress={() => router.back()}
          className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 active:opacity-70"
          accessibilityLabel={t('common_close')}
        >
          <X size={16} color={isDark ? '#a1a1aa' : '#71717a'} />
        </Pressable>
      </View>

      <View className="flex-1 px-6 pb-4 justify-center gap-6">
        {/* Orb + judul */}
        <View className="items-center gap-2">
          <CatetinOrb size={130} active={true} />
          <Text className="font-display text-2xl font-bold text-zinc-950 dark:text-white">
            Catetin Pro
          </Text>
          <Text className="font-sans text-sm text-zinc-500 text-center">
            {t('paywall_tagline')}
          </Text>
        </View>

        {/* Feature grid 2 kolom */}
        <View className="gap-3">
          {featurePairs.map((pair, i) => (
            <View key={i} className="flex-row gap-3">
              {pair.map((f) => (
                <View key={f.title} className="flex-1 flex-row items-start gap-2">
                  <View className="mt-0.5 h-4 w-4 items-center justify-center rounded-full bg-primary-600 shrink-0">
                    <Check size={9} color="#ffffff" strokeWidth={3} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-sans text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {f.title}
                    </Text>
                    <Text className="font-sans text-xs text-zinc-500 mt-0.5">{f.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Harga + CTA */}
        <View className="gap-2.5">
          <View className="flex-row items-center justify-between rounded-2xl border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950 px-5 py-4">
            <View>
              <Text className="font-sans text-xs text-zinc-500">{t('paywall_per_month')}</Text>
              <Text className="font-sans text-xs text-zinc-400 dark:text-zinc-600 mt-0.5">
                {t('paywall_cancel_anytime')}
              </Text>
            </View>
            <View className="flex-row items-baseline gap-1">
              <Text className="font-display text-3xl font-bold text-zinc-950 dark:text-white">
                Rp 39.000
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onBuy}
            disabled={buying}
            className="w-full items-center justify-center rounded-full bg-primary-600 py-4 active:opacity-90 disabled:opacity-60"
            accessibilityRole="button"
            accessibilityLabel={t('paywall_subscribe_label')}
          >
            {buying ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-sans text-base font-semibold text-white">
                {t('paywall_cta')}
              </Text>
            )}
          </Pressable>

          <View className="flex-row items-center justify-center gap-4">
            <Pressable
              onPress={onRestore}
              disabled={restoring}
              className="active:opacity-60"
              accessibilityRole="button"
              accessibilityLabel={t('paywall_restore')}
            >
              {restoring ? (
                <ActivityIndicator size="small" color="#71717a" />
              ) : (
                <Text className="font-sans text-xs text-zinc-500">{t('paywall_restore')}</Text>
              )}
            </Pressable>
            <Text className="font-sans text-xs text-zinc-300 dark:text-zinc-700">·</Text>
            <Text className="font-sans text-xs text-zinc-500">{t('paywall_terms')}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
