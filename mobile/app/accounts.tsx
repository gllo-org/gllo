import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.6;

interface Account {
  id: string;
  name: string;
  type: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number | null;
  unrealizedPnl: number | null;
  pnlRate: number | null;
}

const CURRENCIES: { code: CurrencyCode; flag: string; label: string }[] = [
  { code: 'EUR', flag: '🇪🇺', label: '유로' },
  { code: 'USD', flag: '🇺🇸', label: '달러' },
  { code: 'GBP', flag: '🇬🇧', label: '파운드' },
  { code: 'KRW', flag: '🇰🇷', label: '원화' },
];

const ACCOUNT_TYPES = [
  { value: 'CASH', label: '현금' },
  { value: 'BANK', label: '은행' },
  { value: 'CARD', label: '카드' },
];

function AccountCard({ account }: { account: Account }) {
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
        <Text style={{ fontSize: 26, marginRight: 10 }}>{CURRENCY_FLAGS[account.currency]}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>
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
        }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: cc.text }}>{account.currency}</Text>
        </View>
      </View>

      <Text style={{ ...typography.amount.medium, color: colors.text.primary, marginBottom: 6 }}>
        {formatCurrency(account.balance, account.currency)}
      </Text>

      {account.averageRate !== null && (
        <Text style={{ fontSize: 12, color: colors.text.secondary }}>
          평단가 {formatCurrency(account.averageRate, 'KRW')} / {account.currency}
        </Text>
      )}

      {account.pnlRate !== null && account.unrealizedPnl !== null && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 6 }}>
          <Text style={{
            fontSize: 13, fontWeight: '600',
            color: isPositive ? colors.profit.text : colors.loss.text,
          }}>
            {isPositive ? '▲' : '▼'} {Math.abs(account.pnlRate).toFixed(2)}%
          </Text>
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
      Alert.alert('', '계좌 이름을 입력해주세요.');
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
      Alert.alert('오류', '계좌를 만들지 못했어요. 다시 시도해주세요.');
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
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
              새 계좌 추가
            </Text>
            <TouchableOpacity onPress={closeSheet} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 22, color: colors.text.tertiary, lineHeight: 26 }}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.screenPadding }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6, fontWeight: '500' }}>
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

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 8, fontWeight: '500' }}>
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
                    <Text style={{ fontSize: 16, marginBottom: 2 }}>{c.flag}</Text>
                    <Text style={{ fontSize: 11, fontWeight: '600', color: active ? cc.text : colors.text.tertiary }}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 8, fontWeight: '500' }}>
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
                      backgroundColor: active ? colors.gradient.primary[0] + '20' : colors.bg.surface,
                      alignItems: 'center',
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? colors.text.brand : colors.system.border,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: active ? '600' : '400', color: active ? colors.text.brand : colors.text.secondary }}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6, fontWeight: '500' }}>
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
            >
              <LinearGradient
                colors={name.trim() && !isPending ? colors.gradient.primary : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' }}
              >
                {isPending
                  ? <ActivityIndicator color={colors.text.inverse} />
                  : <Text style={{ fontSize: 16, fontWeight: '600', color: name.trim() ? colors.text.inverse : colors.text.tertiary }}>
                      계좌 만들기
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function AccountsScreen() {
  const router = useRouter();
  const [createVisible, setCreateVisible] = useState(false);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.screenPadding, paddingTop: 16, paddingBottom: 12,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
          <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
          계좌 관리
        </Text>
        <TouchableOpacity
          onPress={() => setCreateVisible(true)}
          style={{ padding: 8, marginRight: -8 }}
        >
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.brand }}>+ 추가</Text>
        </TouchableOpacity>
      </View>

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
              <AccountCard key={account.id} account={account} />
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
              <Text style={{ fontSize: 22, marginBottom: 6 }}>+</Text>
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>새 계좌 추가</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 80, gap: 16 }}>
            <LinearGradient
              colors={colors.gradient.light}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontSize: 36 }}>🏦</Text>
            </LinearGradient>
            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary }}>
              아직 계좌가 없어요
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              글로와 함께 첫 계좌를 만들어볼까요?{'\n'}통화별로 자산을 관리할 수 있어요.
            </Text>
            <TouchableOpacity onPress={() => setCreateVisible(true)} style={{ marginTop: 8 }}>
              <LinearGradient
                colors={colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: radius.button, paddingVertical: 14, paddingHorizontal: 32 }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.inverse }}>
                  첫 계좌 만들기
                </Text>
              </LinearGradient>
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
