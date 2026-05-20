import { Tabs } from 'expo-router'
import { CatetinTabBar } from '~/components/catetin-tab-bar'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CatetinTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="transactions" options={{ title: 'Riwayat' }} />
      <Tabs.Screen name="add" options={{ title: 'Catat' }} />
      <Tabs.Screen name="companion" options={{ title: 'Curhat' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  )
}
