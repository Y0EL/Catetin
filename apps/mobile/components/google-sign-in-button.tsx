import { Pressable, Text, View } from 'react-native'
import { useGoogleSignIn } from '~/hooks/use-google-sign-in'

export function GoogleSignInButton() {
  const { signIn, signingIn, isReady, error } = useGoogleSignIn()

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Masuk pakai Google"
        disabled={!isReady || signingIn}
        onPress={signIn}
        className="rounded-2xl bg-zinc-900 px-5 py-4 active:opacity-90 disabled:opacity-50 dark:bg-white"
      >
        <Text className="text-center text-base font-semibold text-white dark:text-zinc-900">
          {signingIn ? 'Lagi masuk' : 'Lanjut pakai Google'}
        </Text>
      </Pressable>
      {error ? (
        <Text className="mt-3 text-center text-sm text-danger">{error}</Text>
      ) : (
        <Text className="mt-3 text-center text-xs leading-4 text-zinc-400 dark:text-zinc-500">
          Dengan masuk lo setuju ke ketentuan dan kebijakan privasi Catetin.
        </Text>
      )}
    </View>
  )
}
