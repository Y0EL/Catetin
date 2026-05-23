import { useRouter } from 'expo-router'
import {
  Bell,
  ChevronRight,
  FileText,
  Globe,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sheet,
  Sparkles,
  Sun,
  Target,
  Wallet,
} from 'lucide-react-native'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { PaywallButton } from '~/components/paywall-button'
import { ScreenFade } from '~/components/screen-fade'
import { TelegramLinkRow } from '~/components/telegram-link-row'
import { WhatsappLinkRow } from '~/components/whatsapp-link-row'
import { useAuth } from '~/hooks/use-auth'
import { useNotifPrefs, useTestNotif, useUpdateNotifPrefs } from '~/hooks/use-notif-prefs'
import { downloadAndShareReport } from '~/hooks/use-download-report'
import { signOutUser } from '~/lib/auth'
import { useLang, useT, type Lang } from '~/lib/lang-context'
import { useTheme, type ThemePref } from '~/lib/theme'

const LANG_OPTIONS: { key: Lang; label: string }[] = [
  { key: 'id', label: 'ID' },
  { key: 'en', label: 'EN' },
  { key: 'zh', label: '中' },
]

export default function SettingsTab() {
  const router = useRouter()
  const { user } = useAuth()
  const t = useT()
  const initial = (user?.displayName ?? user?.email ?? 'C').charAt(0).toUpperCase()

  return (
    <SafeAreaView className="flex-1 bg-zinc-50 dark:bg-zinc-950" edges={['top']}>
      <ScreenFade>
        <ScrollView
          className="flex-1"
          contentContainerClassName="pb-32"
          showsVerticalScrollIndicator={false}
        >
          <View className="px-4 pt-3">
            <Text className="font-sans text-sm text-zinc-500 dark:text-zinc-400">
              {t('settings_account_label')}
            </Text>
            <Text className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {t('settings_title')}
            </Text>
          </View>

          <View className="mx-4 mt-5 flex-row items-center gap-4 rounded-card bg-white p-4 dark:bg-zinc-800">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-950">
              <Text className="font-display text-xl font-bold text-primary-700 dark:text-primary-300">
                {initial}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {user?.displayName ?? t('settings_guest')}
              </Text>
              {user?.email ? (
                <Text className="mt-0.5 font-sans text-sm text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="mx-4 mt-5 overflow-hidden rounded-card bg-primary-600 p-5">
            <View className="flex-row items-center gap-2">
              <Sparkles size={16} color="#ffffff" />
              <Text className="font-display text-base font-bold text-white">Catetin Pro</Text>
            </View>
            <Text className="mt-1 font-sans text-sm leading-5 text-primary-100">
              {t('settings_pro_tagline')}
            </Text>
            <View className="mt-4">
              <PaywallButton />
            </View>
          </View>

          <Section title={t('settings_section_finance')}>
            <Row
              icon={<Wallet size={18} color="#71717a" />}
              label={t('settings_wallet_label')}
              hint={t('settings_wallet_hint')}
              onPress={() => router.push('/wallets')}
            />
            <Divider />
            <Row
              icon={<Target size={18} color="#71717a" />}
              label={t('settings_budget_label')}
              hint={t('settings_budget_hint')}
              onPress={() => router.push('/budgets')}
            />
            <Divider />
            <ExportRow kind="pdf" />
            <Divider />
            <ExportRow kind="csv" />
          </Section>

          <Section title={t('settings_section_channel')}>
            <TelegramLinkRow />
            <Divider />
            <WhatsappLinkRow />
          </Section>

          <Section title={t('settings_section_notif')}>
            <NotifPrefsSection />
          </Section>

          <Section title={t('settings_section_app')}>
            <ThemeSelector />
            <Divider />
            <LangSelector />
          </Section>

          <Section title={t('settings_section_about')}>
            <Row icon={<Shield size={18} color="#71717a" />} label={t('settings_privacy')} />
          </Section>

          <View className="mx-4 mt-6">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('settings_signout')}
              onPress={() => signOutUser().catch(() => {})}
              className="flex-row items-center justify-center gap-2 rounded-card bg-white py-3.5 active:opacity-80 dark:bg-zinc-800"
            >
              <LogOut size={16} color="#dc2626" />
              <Text className="font-sans text-sm font-semibold text-danger">
                {t('settings_signout')}
              </Text>
            </Pressable>
            <Text className="mt-5 text-center font-sans text-xs text-zinc-400">Catetin v0.1.0</Text>
          </View>
        </ScrollView>
      </ScreenFade>
    </SafeAreaView>
  )
}

function LangSelector() {
  const { lang, setLang } = useLang()
  const t = useT()

  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Globe size={18} color="#71717a" />
        </View>
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">
          {t('settings_language')}
        </Text>
      </View>
      <View className="mt-3 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {LANG_OPTIONS.map((opt) => {
          const active = lang === opt.key
          return (
            <Pressable
              key={opt.key}
              onPress={() => setLang(opt.key)}
              accessibilityRole="button"
              accessibilityLabel={opt.label}
              className={
                active
                  ? 'flex-1 items-center rounded-full bg-primary-600 py-2'
                  : 'flex-1 items-center rounded-full py-2 active:opacity-60'
              }
            >
              <Text
                className={
                  active
                    ? 'font-sans text-xs font-semibold text-white'
                    : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                }
              >
                {opt.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const themeOptions: { key: ThemePref; label: string; icon: typeof Sun }[] = [
  { key: 'light', label: 'light', icon: Sun },
  { key: 'dark', label: 'dark', icon: Moon },
  { key: 'system', label: 'system', icon: Monitor },
]

function ThemeSelector() {
  const { pref, setPref } = useTheme()
  const t = useT()

  const themeLabel: Record<ThemePref, string> = {
    light: t('settings_theme_light'),
    dark: t('settings_theme_dark'),
    system: t('settings_theme_system'),
  }

  return (
    <View className="px-4 py-3.5">
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Moon size={18} color="#71717a" />
        </View>
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">
          {t('settings_theme')}
        </Text>
      </View>
      <View className="mt-3 flex-row gap-1 rounded-full bg-zinc-100 p-1 dark:bg-zinc-800">
        {themeOptions.map((opt) => {
          const active = pref === opt.key
          const Icon = opt.icon
          const label = themeLabel[opt.key]
          return (
            <Pressable
              key={opt.key}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings_theme')} ${label}`}
              accessibilityState={active ? { selected: true } : {}}
              onPress={() => setPref(opt.key)}
              className={
                active
                  ? 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-primary-600 py-2'
                  : 'flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2 active:opacity-60'
              }
            >
              <Icon size={15} color={active ? '#ffffff' : '#71717a'} />
              <Text
                className={
                  active
                    ? 'font-sans text-xs font-semibold text-white'
                    : 'font-sans text-xs font-medium text-zinc-600 dark:text-zinc-300'
                }
              >
                {label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mx-4 mt-6">
      <Text className="font-sans text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
        {title}
      </Text>
      <View className="mt-3 overflow-hidden rounded-card bg-white dark:bg-zinc-800">
        {children}
      </View>
    </View>
  )
}

function Divider() {
  return <View className="ml-16 h-px bg-zinc-100 dark:bg-zinc-800" />
}

function Row({
  icon,
  label,
  hint,
  cta,
  muted,
  onPress,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  cta?: string
  muted?: boolean
  onPress?: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        muted
          ? 'flex-row items-center gap-3 px-4 py-3.5 opacity-55'
          : 'flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800'
      }
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
        ) : null}
      </View>
      {cta ? (
        <Text className="font-sans text-sm font-semibold text-primary-600 dark:text-primary-200">
          {cta}
        </Text>
      ) : (
        <ChevronRight size={16} color="#a1a1aa" />
      )}
    </Pressable>
  )
}

function ExportRow({ kind }: { kind: 'pdf' | 'csv' }) {
  const [loading, setLoading] = useState(false)
  const t = useT()

  function currentMonth(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }

  async function onPress() {
    if (loading) return
    setLoading(true)
    try {
      await downloadAndShareReport(kind, currentMonth())
    } catch {
      Alert.alert(t('settings_export_failed_title'), t('common_try_again'))
    } finally {
      setLoading(false)
    }
  }

  const label = kind === 'pdf' ? t('settings_pdf_label') : t('settings_csv_label')
  const hint = kind === 'pdf' ? t('settings_pdf_hint') : t('settings_csv_hint')
  const icon =
    kind === 'pdf' ? <FileText size={18} color="#71717a" /> : <Sheet size={18} color="#71717a" />

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
    >
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#71717a" />
      ) : (
        <ChevronRight size={16} color="#a1a1aa" />
      )}
    </Pressable>
  )
}

function NotifPrefsSection() {
  const prefs = useNotifPrefs()
  const update = useUpdateNotifPrefs()
  const test = useTestNotif()
  const t = useT()
  const data = prefs.data
  const tokenReady = data?.hasPushToken === true

  function toggle(key: 'dailyReminder' | 'weeklyRecap' | 'budgetAlerts', value: boolean) {
    update.mutate({ [key]: value })
  }

  return (
    <View>
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label={t('settings_daily_label')}
        hint={t('settings_daily_hint')}
        value={data?.dailyReminder ?? true}
        onChange={(v) => toggle('dailyReminder', v)}
      />
      <Divider />
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label={t('settings_weekly_label')}
        hint={t('settings_weekly_hint')}
        value={data?.weeklyRecap ?? true}
        onChange={(v) => toggle('weeklyRecap', v)}
      />
      <Divider />
      <ToggleRow
        icon={<Bell size={18} color="#71717a" />}
        label={t('settings_budget_alert_label')}
        hint={t('settings_budget_alert_hint')}
        value={data?.budgetAlerts ?? true}
        onChange={(v) => toggle('budgetAlerts', v)}
      />
      <Divider />
      <Pressable
        onPress={() => {
          if (!tokenReady) {
            Alert.alert(t('settings_notif_inactive_title'), t('settings_notif_inactive_body'))
            return
          }
          test.mutate(undefined, {
            onSuccess: () =>
              Alert.alert(t('settings_test_sent_title'), t('settings_test_sent_body')),
            onError: () => Alert.alert(t('common_error'), t('common_try_again')),
          })
        }}
        className="flex-row items-center gap-3 px-4 py-3.5 active:bg-zinc-50 dark:active:bg-zinc-800"
      >
        <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
          <Bell size={18} color="#71717a" />
        </View>
        <View className="flex-1">
          <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">
            {t('settings_test_notif_label')}
          </Text>
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">
            {tokenReady ? t('settings_test_notif_ready') : t('settings_test_notif_not_ready')}
          </Text>
        </View>
      </Pressable>
    </View>
  )
}

function ToggleRow({
  icon,
  label,
  hint,
  value,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  hint?: string
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3.5">
      <View className="h-9 w-9 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans text-base text-zinc-900 dark:text-zinc-100">{label}</Text>
        {hint ? (
          <Text className="mt-0.5 font-sans text-xs text-zinc-500 dark:text-zinc-400">{hint}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  )
}
