import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut,
  type User,
} from 'firebase/auth'
import { getFirebaseAuth } from './firebase'
import { identifyUser, signOutPurchases } from './revenuecat'

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  try {
    return onAuthStateChanged(getFirebaseAuth(), callback)
  } catch {
    callback(null)
    return () => {}
  }
}

export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken)
  const result = await signInWithCredential(getFirebaseAuth(), credential)
  try {
    await identifyUser(result.user.uid)
  } catch {
    // RevenueCat identify is best effort, do not block auth
  }
  return result.user
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth())
  try {
    await signOutPurchases()
  } catch {
    // best effort
  }
}

export function getCurrentUser(): User | null {
  return getFirebaseAuth().currentUser
}

export async function getCurrentIdToken(): Promise<string | null> {
  const user = getCurrentUser()
  if (!user) return null
  return user.getIdToken()
}
