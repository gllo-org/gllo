import { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api/client';
import { colors, spacing, radius } from '@/theme';

export default function LogoutCompleteScreen() {
  const { signOut } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
    signOut();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
      }}>
        <Text style={{ fontSize: 64, marginBottom: 28 }}>👋</Text>

        <Text style={{
          fontSize: 24,
          fontFamily: 'SUIT-Bold',
          color: colors.text.primary,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          잘 가요, 또 만나요!
        </Text>

        <Text style={{
          fontSize: 15,
          fontFamily: 'Pretendard-Regular',
          color: colors.text.secondary,
          textAlign: 'center',
          lineHeight: 24,
        }}>
          글로는 언제든지{'\n'}돌아올 준비가 되어 있어요 🌍
        </Text>

        <TouchableOpacity
          onPress={() => router.replace('/(auth)/login')}
          style={{
            marginTop: 52,
            backgroundColor: colors.text.brand,
            paddingHorizontal: 36,
            paddingVertical: 15,
            borderRadius: radius.pill,
          }}
        >
          <Text style={{
            color: colors.text.inverse,
            fontSize: 16,
            fontFamily: 'Pretendard-SemiBold',
          }}>
            로그인 화면으로
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
