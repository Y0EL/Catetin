import AsyncStorage from '@react-native-async-storage/async-storage'
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, initializeAuth, type Auth } from 'firebase/auth'
import { Platform } from 'react-native'
// @ts-expect-error getReactNativePersistence is bundled but missing from v11 public types
import { getReactNativePersistence } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
}

let firebaseApp: FirebaseApp | null = null
let firebaseAuth: Auth | null = null

export function getFirebaseApp(): FirebaseApp {
  if (firebaseApp) return firebaseApp
  const existing = getApps()
  firebaseApp = existing.length > 0 ? existing[0]! : initializeApp(firebaseConfig)
  return firebaseApp
}

export function getFirebaseAuth(): Auth {
  if (firebaseAuth) return firebaseAuth
  const app = getFirebaseApp()
  if (Platform.OS === 'web') {
    firebaseAuth = getAuth(app)
  } else {
    try {
      firebaseAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      })
    } catch {
      firebaseAuth = getAuth(app)
    }
  }
  return firebaseAuth
}
