import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { Flag, type FlagCode } from '@/components/ui/Flag';
import { useTheme, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { ArrowLeft, X, Trash2, ArrowRightLeft, Landmark, Plus, TrendingUp, TrendingDown } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.6;

interface Account {
  id: number;
  name: string;
  type: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number | null;
  unrealizedPnl: number | null;
  pnlRate: number | null;
}

const CURRENCIES: { code: CurrencyCode; flag: FlagCode; label: string }[] = [
  { code: 'EUR', flag: 'EU', label: '유로' },
  { code: 'USD', flag: 'US', label: '달러' },
  { code: 'GBP', flag: 'GB', label: '파운드' },
  { code: 'KRW', flag: 'KR', label: '원화' },
];

const ACCOUNT_TYPES = [
  { value: 'CASH', label: '현금' },
  { value: 'BANK', label: '은행' },
  { value: 'CARD', label: '카드' },
];

function AccountCard({ account, onDelete }: { account: Account; onDelete: () => void }) {
  const { colors } = useTheme();
  const cc = colors.currency[account.currency];
  const isPositive = (account.pnlRate ?? 0) >= 0;

  return (
    <View style={{
      backgroundColor: cc.bg,
      borderRadius: radius.card,
      padding: spacing.cardPadding,
      marginBottom: 12,
      ...shadow.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ marginRight: 10 }}><Flag code={CURRENCY_FLAGS[account.currency]} size={30} /></View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
            {account.name}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 1 }}>
            {ACCOUNT_TYPES.find(t => t.value === account.type)?.label ?? account.type}
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: radius.chip,
          backgroundColor: cc.primary + '20',
          marginRight: 8,
        }}>
          <Text style={{ fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: cc.text }}>{account.currency}</Text>
        </View>
        <TouchableOpacity
          onPress={onDelete}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ padding: 4 }}
        >
          <Trash2 size={17} color={colors.text.tertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <Text style={{ ...typography.amount.medium, color: colors.text.primary, marginBottom: 6 }}>
        {formatCurrency(account.balance, account.currency)}
      </Text>

      {account.averageRate !== null && (
        <Text style={{ fontSize: 12, color: colors.text.secondary }}>
          평단가 {formatCurrency(account.averageRate, 'KRW')} / {account.currency}
        </Text>
      )}

      {account.pnlRate !== null && !isNaN(account.pnlRate) && account.unrealizedPnl !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            {isPositive
              ? <TrendingUp size={13} color={colors.profit.text} strokeWidth={2.4} />
              : <TrendingDown size={13} color={colors.loss.text} strokeWidth={2.4} />}
            <Text style={{
              fontSize: 13, fontFamily: 'Pretendard-SemiBold',
              color: isPositive ? colors.profit.text : colors.loss.text,
            }}>
              {Math.abs(account.pnlRate).toFixed(2)}%
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.text.secondary }}>
            ({isPositive ? '+' : ''}{formatCurrency(account.unrealizedPnl, 'KRW')})
          </Text>
        </View>
      )}
    </View>
  );
}

function CreateAccountSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('EUR');
  const [accountType, setAccountType] = useState('CASH');
  const [initialBalance, setInitialBalance] = useState('');

  const { mutateAsync: create, isPending } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/accounts', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showAlert('완료', '계좌가 추가되었습니다.');
    },
  });

  useEffect(() => {
    if (visible) {
      resetForm();
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_H);
    }
  }, [visible]);

  function resetForm() {
    setName('');
    setCurrency('EUR');
    setAccountType('CASH');
    setInitialBalance('');
  }

  function closeSheet() {
    Animated.timing(translateY, {
      toValue: SHEET_H,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  async function handleCreate() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showAlert('', '계좌 이름을 입력해주세요.');
      return;
    }
    const balance = parseFloat(initialBalance) || 0;
    try {
      await create({
        name: trimmedName,
        type: accountType,
        currency,
        initialBalance: balance,
      });
      closeSheet();
    } catch {
      showAlert('오류', '계좌를 만들지 못했어요. 다시 시도해주세요.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: colors.bg.overlay }}
          activeOpacity={1}
          onPress={closeSheet}
        />

        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: SHEET_H,
          backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom,
          borderTopRightRadius: radius.bottom,
          transform: [{ translateY }],
        }}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.screenPadding, paddingVertical: 12,
          }}>
            <Text style={{ flex: 1, fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
              새 계좌 추가
            </Text>
            <TouchableOpacity onPress={closeSheet} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={colors.text.tertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.screenPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6, fontFamily: 'Pretendard-Medium' }}>
              계좌 이름
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예: 독일 유로 계좌"
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="done"
              style={{
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                borderWidth: 1.5,
                borderColor: name ? colors.text.brand : colors.system.border,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 15,
                color: colors.text.primary,
                marginBottom: 20,
              }}
            />

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 8, fontFamily: 'Pretendard-Medium' }}>
              통화 선택
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {CURRENCIES.map((c) => {
                const cc = colors.currency[c.code];
                const active = currency === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => setCurrency(c.code)}
                    style={{
                      flex: 1, paddingVertical: 10,
                      borderRadius: radius.chip,
                      backgroundColor: active ? cc.bg : colors.bg.surface,
                      alignItems: 'center',
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? cc.primary : colors.system.border,
                    }}
                  >
                    <View style={{ marginBottom: 4 }}><Flag code={c.flag} size={20} /></View>
                    <Text style={{ fontSize: 11, fontFamily: 'Pretendard-SemiBold', color: active ? cc.text : colors.text.tertiary }}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 8, fontFamily: 'Pretendard-Medium' }}>
              계좌 종류
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {ACCOUNT_TYPES.map((t) => {
                const active = accountType === t.value;
                return (
                  <TouchableOpacity
                    key={t.value}
                    onPress={() => setAccountType(t.value)}
                    style={{
                      flex: 1, paddingVertical: 10,
                      borderRadius: radius.chip,
                      backgroundColor: active ? colors.accent.light : colors.bg.surface,
                      alignItems: 'center',
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? colors.text.brand : colors.system.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular', color: active ? colors.text.brand : colors.text.secondary }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6, fontFamily: 'Pretendard-Medium' }}>
              초기 잔액 (선택)
            </Text>
            <TextInput
              value={initialBalance}
              onChangeText={(v) => {
                const clean = v.replace(/[^0-9.]/g, '');
                const parts = clean.split('.');
                if (parts.length > 2) return;
                if (parts[1] && parts[1].length > 2 && currency !== 'KRW') return;
                if (currency === 'KRW' && clean.includes('.')) return;
                setInitialBalance(clean);
              }}
              placeholder="0"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              style={{
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                borderWidth: 1.5,
                borderColor: initialBalance ? colors.text.brand : colors.system.border,
                paddingHorizontal: 14,
                paddingVertical: 13,
                fontSize: 15,
                color: colors.text.primary,
                marginBottom: 24,
              }}
            />
          </ScrollView>

          <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 6, paddingBottom: 28 }}>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={!name.trim() || isPending}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={{
                backgroundColor: name.trim() && !isPending ? colors.accent.primary : colors.bg.input,
                borderRadius: radius.button, paddingVertical: 15, alignItems: 'center',
              }}
            >
              {isPending
                ? <ActivityIndicator color={colors.text.inverse} />
                : <Text style={{ fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: name.trim() ? colors.text.inverse : colors.text.tertiary }}>
                    계좌 만들기
                  </Text>
              }
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function AccountsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
  });

  const { mutateAsync: deleteAccount } = useMutation({
    mutationFn: (id: number) => apiClient(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handleDelete(account: Account) {
    showAlert(
      '계좌 삭제',
      `"${account.name}"을(를) 삭제할까요?\n계좌와 관련된 모든 데이터가 삭제돼요.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount(account.id);
              showAlert('완료', '계좌가 삭제되었습니다.');
            } catch {
              showAlert('오류', '삭제에 실패했어요. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.screenPadding, paddingTop: 16, paddingBottom: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
          계좌 관리
        </Text>
        <TouchableOpacity
          onPress={() => setCreateVisible(true)}
          style={{ padding: 8, marginRight: -8 }}
        >
          <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.brand }}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => router.push('/exchange')}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
          marginHorizontal: spacing.screenPadding, marginBottom: 12,
          paddingVertical: 11,
          borderRadius: radius.chip,
          backgroundColor: colors.bg.surface,
          borderWidth: 1.5,
          borderColor: colors.system.border,
          gap: 6,
        }}
      >
        <ArrowRightLeft size={16} color={colors.accent.primary} strokeWidth={2} />
        <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.brand }}>환전 기록</Text>
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={{ gap: 12 }}>
            {[1, 2].map((i) => (
              <View key={i} style={{
                height: 130,
                backgroundColor: colors.system.skeleton,
                borderRadius: radius.card,
              }} />
            ))}
          </View>
        ) : accounts && accounts.length > 0 ? (
          <>
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onDelete={() => handleDelete(account)}
              />
            ))}
            <TouchableOpacity
              onPress={() => setCreateVisible(true)}
              style={{
                borderRadius: radius.card,
                borderWidth: 1.5,
                borderColor: colors.system.border,
                borderStyle: 'dashed',
                padding: spacing.cardPadding,
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <View style={{ marginBottom: 6 }}><Plus size={22} color={colors.text.secondary} strokeWidth={2.2} /></View>
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>새 계좌 추가</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 16 }}>
            <LinearGradient
              colors={colors.gradient.hero}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Landmark size={36} color={colors.text.tertiary} strokeWidth={1.6} />
            </LinearGradient>
            <Text style={{ fontSize: 18, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
              아직 계좌가 없어요
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              GLLO와 함께 첫 계좌를 만들어볼까요?{'\n'}통화별로 자산을 관리할 수 있어요.
            </Text>
            <TouchableOpacity
              onPress={() => setCreateVisible(true)}
              accessibilityRole="button"
              style={{
                marginTop: 8,
                backgroundColor: colors.accent.primary,
                borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 32,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>
                첫 계좌 만들기
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CreateAccountSheet
        visible={createVisible}
        onClose={() => setCreateVisible(false)}
      />
    </SafeAreaView>
  );
}
