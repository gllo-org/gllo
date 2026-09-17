import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/stores/authStore';
import { colors, spacing, radius } from '@/theme';

const WARNINGS = [
  '탈퇴 후 30일 이내 같은 이메일로 재로그인하면 계정을 복구할 수 있어요.',
  '30일이 지나면 계정이 초기화되며 이전 데이터를 불러올 수 없어요.',
  '거래 내역, 계좌, 예산, 여행 기록이 모두 사라져요.',
];

export default function DeleteAccountScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();
  const [deleting, setDeleting] = useState(false);

  function handleDeletePress() {
    showAlert(
      '정말 탈퇴하시겠어요?',
      '탈퇴 후 30일 이내 재로그인하면 계정을 복구할 수 있어요.',
      [
        { text: '취소', style: 'cancel' },
        { text: '탈퇴하기', style: 'destructive', onPress: confirmDelete },
      ],
    );
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await apiClient('/auth/account', { method: 'DELETE' });
      await signOut();
    } catch {
      setDeleting(false);
      showAlert('오류', 'GLLO가 탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ fontSize: 20, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary }}>
          계정 탈퇴
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}>
        <View style={{
          backgroundColor: colors.loss.light,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: colors.loss.bg,
        }}>
          <Text style={{ fontSize: 28, textAlign: 'center', marginBottom: 12 }}>⚠️</Text>
          <Text style={{
            fontSize: 17,
            fontWeight: '700',
            color: colors.loss.text,
            textAlign: 'center',
            marginBottom: 16,
          }}>
            탈퇴 전 꼭 확인해주세요
          </Text>
          <View style={{ gap: 10 }}>
            {WARNINGS.map((text, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                <Text style={{ fontSize: 14, color: colors.loss.text, lineHeight: 20 }}>•</Text>
                <Text style={{ flex: 1, fontSize: 14, color: colors.loss.text, lineHeight: 20 }}>
                  {text}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          marginBottom: 40,
        }}>
          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 22 }}>
            탈퇴 후에도 30일 동안은 같은 이메일로 로그인하면 계정을 그대로 사용할 수 있어요. GLLO와 함께한 시간이 소중하니, 다시 돌아와주세요 💜
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleDeletePress}
          disabled={deleting}
          style={{
            backgroundColor: colors.loss.bg,
            borderRadius: radius.button,
            paddingVertical: 16,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.loss.text,
          }}
        >
          {deleting ? (
            <ActivityIndicator color={colors.loss.text} />
          ) : (
            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.loss.text }}>
              계정 탈퇴하기
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
