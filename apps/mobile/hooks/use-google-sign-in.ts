import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin'
import { useState } from 'react'
import { signInWithGoogleIdToken } from '~/lib/auth'

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS,
})

export function useGoogleSignIn() {
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      await GoogleSignin.hasPlayServices()
      const response = await GoogleSignin.signIn()
      if (isSuccessResponse(response)) {
        const idToken = response.data.idToken
        if (!idToken) throw new Error('Token Google tidak ditemukan')
        await signInWithGoogleIdToken(idToken)
      }
    } catch (err: unknown) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS) {
          return
        }
      }
      setError(err instanceof Error ? err.message : 'Sign in gagal')
    } finally {
      setSigningIn(false)
    }
  }

  return { signingIn, error, isReady: true, signIn }
}
