import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  Animated, Easing, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { Flag } from '@/components/ui/Flag';
import { useTheme, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { ArrowLeft, X, ArrowUpDown, Delete } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const PICKER_H = SCREEN_H * 0.55;

interface Account {
  id: number;
  name: string;
  type: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number | null;
}

interface ExchangeRateResponse {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
}

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  CASH: '현금',
  BANK: '은행',
  CARD: '카드',
};

const PAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del'];

function NumberPad({ onPress }: { onPress: (key: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 }}>
      {PAD_KEYS.map((key) => (
        <TouchableOpacity
          key={key}
          onPress={() => onPress(key)}
          activeOpacity={0.6}
          style={{
            width: '33.33%',
            paddingVertical: 17,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {key === 'del' ? (
            <Delete size={22} color={colors.text.secondary} strokeWidth={2} />
          ) : (
            <Text style={{
              fontSize: 22,
              fontFamily: 'SUIT-Medium',
              color: colors.text.primary,
            }}>
              {key}
            </Text>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AccountPickerSheet({
  visible,
  accounts,
  excludeId,
  onSelect,
  onClose,
  onAddAccount,
}: {
  visible: boolean;
  accounts: Account[];
  excludeId: number | null;
  onSelect: (account: Account) => void;
  onClose: () => void;
  onAddAccount?: () => void;
}) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(PICKER_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(PICKER_H);
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, {
      toValue: PICKER_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  const selectable = accounts.filter((a) => a.id !== excludeId);

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
          height: PICKER_H,
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
              계좌 선택
            </Text>
            <TouchableOpacity onPress={closeSheet} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={colors.text.tertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: spacing.screenPadding, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
          >
            {selectable.map((account) => {
              const cc = colors.currency[account.currency];
              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => { onSelect(account); closeSheet(); }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: cc.bg,
                    borderRadius: radius.card,
                    padding: 16,
                    marginBottom: 10,
                    ...shadow.card,
                  }}
                >
                  <View style={{ marginRight: 12 }}><Flag code={CURRENCY_FLAGS[account.currency]} size={30} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                      {account.name}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: cc.text }}>
                    {formatCurrency(account.balance, account.currency)}
                  </Text>
                </TouchableOpacity>
              );
            })}
            {selectable.length === 0 && (
              <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 16 }}>
                <Text style={{ fontSize: 14, color: colors.text.tertiary }}>
                  선택 가능한 계좌가 없어요
                </Text>
              </View>
            )}
            {onAddAccount && (
              <TouchableOpacity
                onPress={() => { closeSheet(); setTimeout(onAddAccount, 250); }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  paddingVertical: 14,
                  borderRadius: radius.card,
                  borderWidth: 1.5,
                  borderColor: colors.text.brand,
                  borderStyle: 'dashed',
                  marginTop: 8,
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.brand }}>
                  + 계좌 추가하기
                </Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function ExchangeScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [amountStr, setAmountStr] = useState('0');
  const [pickerTarget, setPickerTarget] = useState<'from' | 'to' | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
  });

  const rateQueryEnabled = !!(fromAccount && toAccount && fromAccount.currency !== toAccount.currency);
  const { data: rateData } = useQuery({
    queryKey: ['exchange-rate', fromAccount?.currency, toAccount?.currency],
    queryFn: () =>
      apiClient<ExchangeRateResponse>(
        `/exchange-rates/${fromAccount!.currency}/${toAccount!.currency}`
      ),
    enabled: rateQueryEnabled,
    staleTime: 1000 * 60 * 10,
  });

  const { mutateAsync: doExchange, isPending } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/exchange', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handlePad(key: string) {
    setAmountStr((prev) => {
      if (key === 'del') {
        const next = prev.length > 1 ? prev.slice(0, -1) : '0';
        return next;
      }
      if (key === '.' && prev.includes('.')) return prev;
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  }

  async function handleSubmit() {
    const amount = parseFloat(amountStr);
    if (!fromAccount || !toAccount) {
      showAlert('', '출금 계좌와 입금 계좌를 선택해주세요.');
      return;
    }
    if (!amount || amount <= 0) {
      showAlert('', '환전 금액을 입력해주세요.');
      return;
    }
    if (fromAccount.id === toAccount.id) {
      showAlert('', '출금 계좌와 입금 계좌는 달라야 해요.');
      return;
    }
    if (amount > fromAccount.balance) {
      showAlert('', '잔액이 부족해요.');
      return;
    }
    try {
      await doExchange({
        fromAccountId: fromAccount.id,
        toAccountId: toAccount.id,
        amount,
      });
      showAlert('완료', '환전이 완료되었어요.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      showAlert('오류', '환전에 실패했어요. 다시 시도해주세요.');
    }
  }

  const fromCc = fromAccount ? colors.currency[fromAccount.currency] : null;
  const toCc = toAccount ? colors.currency[toAccount.currency] : null;
  const amount = parseFloat(amountStr) || 0;
  const convertedAmount = rateData && amount > 0 ? amount * rateData.rate : null;
  const isValid = !!(fromAccount && toAccount && amount > 0 && fromAccount.id !== toAccount.id);

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
          환전 기록
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: spacing.screenPadding }}>
          <Text style={{ fontSize: 13, color: colors.text.secondary, fontFamily: 'Pretendard-Medium', marginBottom: 8 }}>
            출금 계좌
          </Text>
          <TouchableOpacity
            onPress={() => setPickerTarget('from')}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: fromCc ? fromCc.bg : colors.bg.surface,
              borderRadius: radius.card,
              padding: 16,
              marginBottom: 20,
              borderWidth: fromAccount ? 0 : 1.5,
              borderColor: colors.system.border,
              borderStyle: 'dashed',
              ...shadow.card,
            }}
          >
            {fromAccount ? (
              <>
                <View style={{ marginRight: 12 }}><Flag code={CURRENCY_FLAGS[fromAccount.currency]} size={30} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                    {fromAccount.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                    잔액 {formatCurrency(fromAccount.balance, fromAccount.currency)}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: radius.chip,
                  backgroundColor: fromCc!.primary + '20',
                }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: fromCc!.text }}>
                    {fromAccount.currency}
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, color: colors.text.tertiary }}>계좌를 선택해주세요</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{ alignItems: 'center', marginBottom: 12, marginTop: -8 }}>
            <View style={{
              width: 32, height: 32,
              borderRadius: 16,
              backgroundColor: colors.bg.input,
              borderWidth: 1,
              borderColor: colors.system.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ArrowUpDown size={18} color={colors.text.secondary} strokeWidth={2} />
            </View>
          </View>

          <Text style={{ fontSize: 13, color: colors.text.secondary, fontFamily: 'Pretendard-Medium', marginBottom: 8 }}>
            입금 계좌
          </Text>
          <TouchableOpacity
            onPress={() => setPickerTarget('to')}
            activeOpacity={0.75}
            style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: toCc ? toCc.bg : colors.bg.surface,
              borderRadius: radius.card,
              padding: 16,
              marginBottom: 24,
              borderWidth: toAccount ? 0 : 1.5,
              borderColor: colors.system.border,
              borderStyle: 'dashed',
              ...shadow.card,
            }}
          >
            {toAccount ? (
              <>
                <View style={{ marginRight: 12 }}><Flag code={CURRENCY_FLAGS[toAccount.currency]} size={30} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                    {toAccount.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                    잔액 {formatCurrency(toAccount.balance, toAccount.currency)}
                  </Text>
                </View>
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 4,
                  borderRadius: radius.chip,
                  backgroundColor: toCc!.primary + '20',
                }}>
                  <Text style={{ fontSize: 12, fontFamily: 'Pretendard-SemiBold', color: toCc!.text }}>
                    {toAccount.currency}
                  </Text>
                </View>
              </>
            ) : (
              <View style={{ flex: 1, alignItems: 'center', paddingVertical: 6 }}>
                <Text style={{ fontSize: 14, color: colors.text.tertiary }}>계좌를 선택해주세요</Text>
              </View>
            )}
          </TouchableOpacity>

          <View style={{
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: 20,
            marginBottom: 8,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6 }}>
              환전 금액
            </Text>
            <Text style={{ ...typography.amount.large, color: colors.text.primary }}>
              {fromAccount
                ? formatCurrency(parseFloat(amountStr) || 0, fromAccount.currency)
                : amountStr}
            </Text>
            {rateData && convertedAmount !== null && (
              <View style={{ marginTop: 10, alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                  현재 환율 1 {fromAccount?.currency} = {rateData.rate.toFixed(4)} {toAccount?.currency}
                </Text>
                <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: toCc?.text ?? colors.text.brand }}>
                  ≈ {formatCurrency(convertedAmount, toAccount!.currency)}
                </Text>
              </View>
            )}
          </View>
        </View>

        <NumberPad onPress={handlePad} />

        <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 16 }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!isValid || isPending || accountsLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={{
              backgroundColor: isValid && !isPending ? colors.accent.primary : colors.bg.input,
              borderRadius: radius.button, paddingVertical: 15, alignItems: 'center',
            }}
          >
            {isPending
              ? <ActivityIndicator color={colors.text.inverse} />
              : <Text style={{ fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: isValid ? colors.text.inverse : colors.text.tertiary }}>
                  환전하기
                </Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AccountPickerSheet
        visible={pickerTarget !== null}
        accounts={accounts}
        excludeId={pickerTarget === 'from' ? toAccount?.id ?? null : fromAccount?.id ?? null}
        onSelect={(account) => {
          if (pickerTarget === 'from') setFromAccount(account);
          else setToAccount(account);
          setPickerTarget(null);
        }}
        onClose={() => setPickerTarget(null)}
        onAddAccount={() => router.push('/accounts')}
      />
    </SafeAreaView>
  );
}
