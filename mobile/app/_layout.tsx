import { useEffect } from 'react';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { apiClient, ApiError } from '@/lib/api/client';
import { ThemeProvider } from '@/theme';
import { hasTutorialBeenSeen } from './tutorial';
import '../global.css';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthGuard() {
  const { session, isLoading, setSession, setLoading, pendingPinSetup } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isLoading || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const isLogoutComplete = (segments as string[])[1] === 'logout-complete';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup && !isLogoutComplete && !pendingPinSetup) {
      checkOnboardingAndRoute();
    }
  }, [session, isLoading, segments, pendingPinSetup, rootNavigationState?.key]);

  async function checkOnboardingAndRoute() {
    try {
      const profile = await apiClient<{ onboardingCompleted: boolean }>('/user/profile');
      if (profile.onboardingCompleted) {
        const seen = await hasTutorialBeenSeen();
        router.replace(seen ? '/(tabs)' : '/tutorial');
      } else {
        router.replace('/onboarding');
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        router.replace('/onboarding');
      } else if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
        router.replace('/(auth)/login');
      } else {
        const seen = await hasTutorialBeenSeen();
        router.replace(seen ? '/(tabs)' : '/tutorial');
      }
    }
  }

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular':  require('../assets/fonts/pretendard/Pretendard-Regular.otf'),
    'Pretendard-Medium':   require('../assets/fonts/pretendard/Pretendard-Medium.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/pretendard/Pretendard-SemiBold.otf'),
    'Pretendard-Bold':     require('../assets/fonts/pretendard/Pretendard-Bold.otf'),
    'SUIT-Regular':        require('../assets/fonts/suite/SUIT-Regular.otf'),
    'SUIT-Medium':         require('../assets/fonts/suite/SUIT-Medium.otf'),
    'SUIT-SemiBold':       require('../assets/fonts/suite/SUIT-SemiBold.otf'),
    'SUIT-Bold':           require('../assets/fonts/suite/SUIT-Bold.otf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="onboarding"
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="tutorial"
              options={{ animation: 'fade' }}
            />
            <Stack.Screen
              name="accounts"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="exchange"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="budget"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="transaction/[id]"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="categories"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="recurring"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="report"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="trips"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="unrealized-pnl"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="profile"
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="delete-account"
              options={{ animation: 'slide_from_right' }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
