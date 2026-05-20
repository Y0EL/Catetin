import { Pressable, Text, View } from 'react-native'
import { useGoogleSignIn } from '~/hooks/use-google-sign-in'

export function GoogleSignInButton() {
  const { signIn, signingIn, isReady, error } = useGoogleSignIn()

  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Lanjut pakai Google"
        disabled={!isReady || signingIn}
        onPress={signIn}
        className="items-center rounded-full bg-primary-600 py-4 active:opacity-90 disabled:opacity-50"
      >
        <Text className="font-sans text-base font-semibold text-white">
          {signingIn ? 'Lagi masuk' : 'Lanjut pakai Google'}
        </Text>
      </Pressable>
      {error ? (
        <Text className="mt-2 text-center font-sans text-sm text-danger">{error}</Text>
      ) : null}
    </View>
  )
}
