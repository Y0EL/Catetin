import Constants from 'expo-constants'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import { apiFetch } from '~/lib/api'
import { useAuth } from './use-auth'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  if (!Device.isDevice) return null

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const projectId =
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    Constants.easConfig?.projectId
  const token = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
  return token.data
}

export function useRegisterPush() {
  const { user } = useAuth()
  const registered = useRef<string | null>(null)

  useEffect(() => {
    if (!user) return
    if (registered.current === user.uid) return
    let cancelled = false

    void (async () => {
      const token = await getExpoPushToken().catch(() => null)
      if (cancelled || !token) return
      try {
        await apiFetch('/v1/notif/register-token', {
          method: 'POST',
          body: JSON.stringify({ token }),
        })
        registered.current = user.uid
      } catch {
        // diam-diam, gak fatal
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user])
}
