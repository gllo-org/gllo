import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors, spacing, radius } from '@/theme';

interface SettingsRowProps {
  label: string;
  emoji: string;
  onPress?: () => void;
  isDanger?: boolean;
}

function SettingsRow({ label, emoji, onPress, isDanger = false }: SettingsRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: spacing.screenPadding,
        borderBottomWidth: 1,
        borderBottomColor: colors.system.divider,
      }}
    >
      <Text style={{ fontSize: 20, marginRight: 12 }}>{emoji}</Text>
      <Text style={{
        flex: 1,
        fontSize: 15,
        color: isDanger ? colors.loss.text : colors.text.primary,
      }}>
        {label}
      </Text>
      <Text style={{ color: colors.text.tertiary }}>›</Text>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  function handleSignOut() {
    Alert.alert('로그아웃', '로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => router.replace('/(auth)/logout-complete'),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{ paddingHorizontal: spacing.screenPadding, paddingVertical: 16 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary }}>
          더보기
        </Text>
      </View>

      <ScrollView>
        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          <SettingsRow emoji="👤" label="프로필 설정" onPress={() => router.push('/profile')} />
          <SettingsRow emoji="🌍" label="기본 정보 수정" onPress={() => router.push('/onboarding')} />
          <SettingsRow emoji="💰" label="계좌 관리" onPress={() => router.push('/accounts')} />
          <SettingsRow emoji="🏷️" label="카테고리 관리" onPress={() => router.push('/categories')} />
          <SettingsRow emoji="🔁" label="고정 지출 관리" onPress={() => router.push('/recurring')} />
          <SettingsRow emoji="✈️" label="여행 기록" onPress={() => router.push('/trips')} />
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          <SettingsRow emoji="📄" label="월간 리포트" onPress={() => router.push('/report')} />
          <SettingsRow emoji="📈" label="미실현 손익" onPress={() => router.push('/unrealized-pnl')} />
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          <SettingsRow emoji="🚪" label="로그아웃" onPress={handleSignOut} />
          <SettingsRow emoji="⚠️" label="계정 탈퇴" isDanger onPress={() => router.push('/delete-account')} />
        </View>

        <Text style={{
          textAlign: 'center',
          fontSize: 12,
          color: colors.text.tertiary,
          paddingVertical: 16,
        }}>
          글로 v1.0.0 · 글로와 함께한 오늘도 수고했어요 💜
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
