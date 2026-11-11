import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AlertHost } from '@/components/AlertHost';
import { ListsProvider } from '@/store/ListsContext';
import { PlannerProvider } from '@/store/PlannerContext';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ListsProvider>
        <PlannerProvider>
          <StatusBar style="dark" />
          <Stack>
            <Stack.Screen name="index" options={{ title: 'MyOrganizer' }} />
          </Stack>
          <AlertHost />
        </PlannerProvider>
      </ListsProvider>
    </SafeAreaProvider>
  );
}
