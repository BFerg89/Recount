import { Geist_400Regular } from '@expo-google-fonts/geist/400Regular';
import { Geist_500Medium } from '@expo-google-fonts/geist/500Medium';
import { Geist_600SemiBold } from '@expo-google-fonts/geist/600SemiBold';
import { Newsreader_500Medium } from '@expo-google-fonts/newsreader/500Medium';
import { Newsreader_500Medium_Italic } from '@expo-google-fonts/newsreader/500Medium_Italic';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { NightLogsProvider } from '@/context/NightLogsContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <AuthProvider>
          <AuthenticatedApp />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AuthenticatedApp() {
  const { session } = useAuth();
  const authKey = session?.user.id ?? 'signed-out';

  return (
    <NightLogsProvider key={authKey}>
      <RootStack />
    </NightLogsProvider>
  );
}

function RootStack() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name={"(onboarding)"} options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="logs" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
