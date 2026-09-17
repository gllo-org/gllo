import { View, Text, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  User, Globe, Wallet, Tag, Repeat, Plane, FileText, TrendingUp,
  LogOut, AlertTriangle, ChevronRight, type LucideIcon,
} from 'lucide-react-native';
import { colors, spacing, radius } from '@/theme';

interface SettingsRowProps {
  label: string;
  icon: LucideIcon;
  onPress?: () => void;
  isDanger?: boolean;
}

function SettingsRow({ label, icon: Icon, onPress, isDanger = false }: SettingsRowProps) {
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
      <View style={{ width: 22, marginRight: 12 }}>
        <Icon
          size={19}
          color={isDanger ? colors.loss.text : colors.text.secondary}
          strokeWidth={2}
        />
      </View>
      <Text style={{
        flex: 1,
        fontSize: 15,
        color: isDanger ? colors.loss.text : colors.text.primary,
      }}>
        {label}
      </Text>
      <ChevronRight size={18} color={colors.text.tertiary} strokeWidth={2} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('로그아웃 하시겠어요?')) {
        router.replace('/(auth)/logout-complete');
      }
      return;
    }
    showAlert('로그아웃', '로그아웃 하시겠어요?', [
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
        <Text style={{ fontSize: 20, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
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
          <SettingsRow icon={User} label="프로필 설정" onPress={() => router.push('/profile')} />
          <SettingsRow icon={Globe} label="기본 정보 수정" onPress={() => router.push('/onboarding')} />
          <SettingsRow icon={Wallet} label="계좌 관리" onPress={() => router.push('/accounts')} />
          <SettingsRow icon={Tag} label="카테고리 관리" onPress={() => router.push('/categories')} />
          <SettingsRow icon={Repeat} label="고정 지출 관리" onPress={() => router.push('/recurring')} />
          <SettingsRow icon={Plane} label="여행 기록" onPress={() => router.push('/trips')} />
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          <SettingsRow icon={FileText} label="월간 리포트" onPress={() => router.push('/report')} />
          <SettingsRow icon={TrendingUp} label="미실현 손익" onPress={() => router.push('/unrealized-pnl')} />
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          marginBottom: 16,
          overflow: 'hidden',
        }}>
          <SettingsRow icon={LogOut} label="로그아웃" onPress={handleSignOut} />
          <SettingsRow icon={AlertTriangle} label="계정 탈퇴" isDanger onPress={() => router.push('/delete-account')} />
        </View>

        <Text style={{
          textAlign: 'center',
          fontSize: 12,
          color: colors.text.tertiary,
          paddingVertical: 16,
        }}>
          GLLO v1.0.0 · GLLO와 함께한 오늘도 수고했어요 💜
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
