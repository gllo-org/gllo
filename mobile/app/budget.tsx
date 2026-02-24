import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const FORM_H = SCREEN_H * 0.52;

interface BudgetStatus {
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  spentRate: number;
  timeProgressRate: number;
  dailyRecommendedAmount: number;
  currency?: CurrencyCode;
}

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'KRW'];

function currentYearMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y}년 ${parseInt(m)}월`;
}

function getBudgetStatusColor(spentRate: number, timeProgressRate: number): string {
  if (spentRate > timeProgressRate + 5) return colors.status.danger;
  if (spentRate > timeProgressRate) return colors.status.warning;
  return colors.status.normal;
}

function getBudgetStatusText(spentRate: number, timeProgressRate: number): string {
  if (spentRate > timeProgressRate + 5) return '이번 달 예산 소진율이 시간 진행율보다 높아요.';
  if (spentRate > timeProgressRate) return '이번 달 예산 소진이 조금 빠른 편이에요.';
  return '글로가 보기엔 이번 달 지출 페이스가 좋아요.';
}

function BudgetGauge({ budgetAmount, spentAmount, remainingAmount, spentRate, timeProgressRate, dailyRecommendedAmount, currency }: BudgetStatus) {
  const clampedSpent = Math.min(spentRate, 100);
  const clampedTime = Math.min(timeProgressRate, 98);
  const statusColor = getBudgetStatusColor(spentRate, timeProgressRate);
  const cur = currency ?? 'KRW';

  return (
    <View style={{
      backgroundColor: colors.bg.surface,
      borderRadius: radius.card,
      padding: spacing.cardPadding,
      ...shadow.card,
    }}>
      <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 6 }}>
        {getBudgetStatusText(spentRate, timeProgressRate)}
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <View>
          <Text style={{ ...typography.amount.medium, color: colors.text.primary }}>
            {formatCurrency(spentAmount, cur)}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 2 }}>
            사용 / {formatCurrency(budgetAmount, cur)} 예산
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: radius.chip,
          backgroundColor: statusColor + '18',
        }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: statusColor }}>
            {spentRate.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={{ position: 'relative', marginBottom: 20 }}>
        <View style={{
          height: 12,
          backgroundColor: colors.system.border,
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: `${clampedSpent}%`, borderRadius: 6 }}
          />
        </View>
        <View style={{
          position: 'absolute',
          top: -5,
          left: `${clampedTime}%`,
          width: 2,
          height: 22,
          backgroundColor: colors.text.tertiary + 'AA',
          borderRadius: 1,
        }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
          <Text style={{ fontSize: 11, color: colors.text.secondary }}>
            예산 소진 {spentRate.toFixed(1)}%
          </Text>
          <Text style={{ fontSize: 11, color: colors.text.tertiary }}>
            시간 경과 {timeProgressRate.toFixed(1)}%
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{
          flex: 1, backgroundColor: colors.bg.screen,
          borderRadius: radius.card, padding: 14,
          borderWidth: 1, borderColor: colors.system.border,
        }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>남은 예산</Text>
          <Text style={{ ...typography.amount.small, color: colors.text.primary, fontWeight: '600' }}>
            {formatCurrency(remainingAmount, cur)}
          </Text>
        </View>
        <View style={{
          flex: 1, backgroundColor: colors.bg.screen,
          borderRadius: radius.card, padding: 14,
          borderWidth: 1, borderColor: colors.system.border,
        }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>하루 권장 지출</Text>
          <Text style={{ ...typography.amount.small, color: colors.text.brand, fontWeight: '600' }}>
            {formatCurrency(dailyRecommendedAmount, cur)}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 12, textAlign: 'center' }}>
        글로가 계산한 오늘의 적정 지출이에요.
      </Text>
    </View>
  );
}

function BudgetFormSheet({ visible, onClose, yearMonth, initialCurrency }: {
  visible: boolean;
  onClose: () => void;
  yearMonth: string;
  initialCurrency?: CurrencyCode;
}) {
  const translateY = useRef(new Animated.Value(FORM_H)).current;
  const queryClient = useQueryClient();
  const [currency, setCurrency] = useState<CurrencyCode>(initialCurrency ?? 'EUR');
  const [amountStr, setAmountStr] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialCurrency) setCurrency(initialCurrency);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(FORM_H);
      setAmountStr('');
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, {
      toValue: FORM_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  const { mutateAsync: saveBudget, isPending } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/budgets', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-status'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  async function handleSave() {
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      Alert.alert('', '예산 금액을 입력해주세요.');
      return;
    }
    try {
      await saveBudget({ yearMonth, amount, currency });
      closeSheet();
    } catch {
      Alert.alert('오류', '예산 설정에 실패했어요. 다시 시도해주세요.');
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
          height: FORM_H,
          backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom,
          borderTopRightRadius: radius.bottom,
          transform: [{ translateY }],
        }}>
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>

          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: spacing.screenPadding,
              paddingTop: 16, paddingBottom: 40,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 4 }}>
              {monthLabel(yearMonth)} 예산 설정
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 24 }}>
              예산을 설정하면 글로가 매일 적정 지출을 계산해드려요.
            </Text>

            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>
              통화
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {CURRENCIES.map((c) => {
                const cc = colors.currency[c];
                const active = currency === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCurrency(c)}
                    style={{
                      flex: 1, paddingVertical: 8,
                      borderRadius: radius.chip,
                      backgroundColor: active ? cc.bg : colors.bg.surface,
                      alignItems: 'center',
                      borderWidth: active ? 1.5 : 1,
                      borderColor: active ? cc.primary : colors.system.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: active ? cc.text : colors.text.tertiary }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>
              예산 금액
            </Text>
            <TextInput
              value={amountStr}
              onChangeText={setAmountStr}
              placeholder={`0 ${currency}`}
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              returnKeyType="done"
              style={{
                fontSize: 24, fontWeight: '700',
                color: colors.text.primary,
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                padding: 14,
                marginBottom: 28,
              }}
            />

            <TouchableOpacity onPress={handleSave} disabled={isPending} activeOpacity={0.85}>
              <LinearGradient
                colors={isPending ? ['#E5E7EB', '#E5E7EB', '#E5E7EB'] : colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' }}
              >
                {isPending
                  ? <ActivityIndicator color={colors.text.inverse} />
                  : <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.inverse }}>
                      설정하기
                    </Text>
                }
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function BudgetScreen() {
  const router = useRouter();
  const [yearMonth] = useState(currentYearMonth);
  const [showForm, setShowForm] = useState(false);

  const { data: status, isLoading, isError } = useQuery({
    queryKey: ['budget-status', yearMonth],
    queryFn: async () => {
      try {
        return await apiClient<BudgetStatus>(`/budgets/status?yearMonth=${yearMonth}`);
      } catch (e) {
        if (e instanceof ApiError && (e.code === 404 || e.code === 400)) {
          return null;
        }
        throw e;
      }
    },
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
          예산 관리
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary }}>
            {monthLabel(yearMonth)}
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 4 }}>
            글로가 이번 달 예산을 계산해봤어요.
          </Text>
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <ActivityIndicator color={colors.text.brand} />
            <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
              글로가 데이터를 불러오고 있어요...
            </Text>
          </View>
        ) : isError ? (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 12 }}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>
              글로가 데이터를 불러오지 못했어요.{'\n'}다시 시도해볼까요?
            </Text>
          </View>
        ) : status ? (
          <>
            <BudgetGauge {...status} />
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              activeOpacity={0.8}
              style={{ marginTop: 16 }}
            >
              <View style={{
                borderWidth: 1.5,
                borderColor: colors.text.brand,
                borderRadius: radius.button,
                paddingVertical: 14,
                alignItems: 'center',
              }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.brand }}>
                  예산 수정하기
                </Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 60, gap: 16 }}>
            <Text style={{ fontSize: 48 }}>💜</Text>
            <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
              예산이 없어요
            </Text>
            <Text style={{
              fontSize: 14, color: colors.text.secondary,
              textAlign: 'center', lineHeight: 22,
            }}>
              이번 달 예산을 아직 설정하지 않았어요.{'\n'}글로와 함께 예산을 정해볼까요?
            </Text>
            <TouchableOpacity onPress={() => setShowForm(true)} activeOpacity={0.85}>
              <LinearGradient
                colors={colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: radius.button,
                  paddingVertical: 14, paddingHorizontal: 36,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.inverse }}>
                  예산 설정하기
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <BudgetFormSheet
        visible={showForm}
        onClose={() => setShowForm(false)}
        yearMonth={yearMonth}
        initialCurrency={status?.currency}
      />
    </SafeAreaView>
  );
}
