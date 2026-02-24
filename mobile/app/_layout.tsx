import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { apiClient, ApiError } from '@/lib/api/client';
import '../global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function AuthGuard() {
  const { session, isLoading, setSession, setLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

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
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      checkOnboardingAndRoute();
    }
  }, [session, isLoading, segments]);

  async function checkOnboardingAndRoute() {
    try {
      const profile = await apiClient<{ onboardingCompleted: boolean }>('/user/profile');
      if (profile.onboardingCompleted) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    } catch (error) {
      if (error instanceof ApiError && error.code === 404) {
        router.replace('/onboarding');
      } else {
        router.replace('/(tabs)');
      }
    }
  }

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
