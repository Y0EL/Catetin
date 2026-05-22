import * as Google from 'expo-auth-session/providers/google'
import * as WebBrowser from 'expo-web-browser'
import { useEffect, useState } from 'react'
import { signInWithGoogleIdToken } from '~/lib/auth'

WebBrowser.maybeCompleteAuthSession()

export type GoogleSignInState = {
  signingIn: boolean
  error: string | null
}

function buildGoogleConfig() {
  const config: Partial<{
    clientId: string
    iosClientId: string
    androidClientId: string
  }> = {}
  const web = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB
  const ios = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS
  const android = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID
  if (web) config.clientId = web
  if (ios) config.iosClientId = ios
  if (android) config.androidClientId = android
  return config
}

export function useGoogleSignIn() {
  const [state, setState] = useState<GoogleSignInState>({ signingIn: false, error: null })

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(buildGoogleConfig())

  useEffect(() => {
    if (!response) return

    if (response.type === 'success') {
      const idToken = response.params['id_token']
      if (!idToken) {
        setState({ signingIn: false, error: 'Token Google tidak ditemukan' })
        return
      }
      setState({ signingIn: true, error: null })
      signInWithGoogleIdToken(idToken)
        .then(() => setState({ signingIn: false, error: null }))
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'Sign in gagal'
          setState({ signingIn: false, error: message })
        })
      return
    }

    if (response.type === 'error') {
      setState({ signingIn: false, error: response.error?.message ?? 'Sign in error' })
      return
    }

    if (response.type === 'cancel' || response.type === 'dismiss') {
      setState({ signingIn: false, error: null })
    }
  }, [response])

  return {
    ...state,
    isReady: Boolean(request),
    signIn: () => {
      setState({ signingIn: true, error: null })
      promptAsync().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Prompt gagal'
        setState({ signingIn: false, error: message })
      })
    },
  }
}
