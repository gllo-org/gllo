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
import { colors, spacing, radius, shadow } from '@/theme';
import type { CurrencyCode } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.82;
const PICKER_H = SCREEN_H * 0.55;

type RuleType = 'INCOME' | 'EXPENSE';
type FrequencyType = 'MONTHLY';

interface RecurringRule {
  id: number;
  name: string;
  title: string;
  type: RuleType;
  amount: number;
  currency: CurrencyCode;
  accountId: number;
  accountName?: string;
  categoryId: number;
  categoryName?: string;
  frequency: FrequencyType;
  dayOfMonth: number;
  startDate: string;
  endDate: string | null;
  nextExecutionDate: string | null;
  active: boolean;
  createdAt: string;
}

interface Account {
  id: number;
  name: string;
  currency: CurrencyCode;
  balance: number;
}

interface Category {
  id: number;
  name: string;
  type: string;
  color: string;
}

const TYPE_LABELS: Record<RuleType, string> = {
  INCOME: '수입',
  EXPENSE: '지출',
};

const CURRENCIES: CurrencyCode[] = ['KRW', 'EUR', 'USD', 'GBP'];

function AccountPickerSheet({
  visible,
  accounts,
  onSelect,
  onClose,
}: {
  visible: boolean;
  accounts: Account[];
  onSelect: (account: Account) => void;
  onClose: () => void;
}) {
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
    Animated.timing(translateY, { toValue: PICKER_H, duration: 220, useNativeDriver: true })
      .start(() => onClose());
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
          height: PICKER_H,
          backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom,
          borderTopRightRadius: radius.bottom,
          transform: [{ translateY }],
        }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.screenPadding, paddingVertical: 12,
          }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary }}>계좌 선택</Text>
            <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 22, color: colors.text.tertiary }}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screenPadding, paddingBottom: 32 }}>
            {accounts.map((account) => {
              const cc = colors.currency[account.currency];
              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => { onSelect(account); closeSheet(); }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    backgroundColor: cc.bg, borderRadius: radius.card,
                    padding: 16, marginBottom: 10, ...shadow.card,
                  }}
                >
                  <Text style={{ fontSize: 24, marginRight: 12 }}>{CURRENCY_FLAGS[account.currency]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>{account.name}</Text>
                    <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                      {formatCurrency(account.balance, account.currency)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function CategoryPickerSheet({
  visible,
  categories,
  ruleType,
  onSelect,
  onClose,
}: {
  visible: boolean;
  categories: Category[];
  ruleType: RuleType;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(PICKER_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0, duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(PICKER_H);
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, { toValue: PICKER_H, duration: 220, useNativeDriver: true })
      .start(() => onClose());
  }

  const filtered = categories.filter((c) =>
    c.type === ruleType || c.type === 'EXPENSE' || c.type === 'INCOME'
  );

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bg.overlay }} activeOpacity={1} onPress={closeSheet} />
        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: PICKER_H, backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom, borderTopRightRadius: radius.bottom,
          transform: [{ translateY }],
        }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.screenPadding, paddingVertical: 12,
          }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary }}>카테고리 선택</Text>
            <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 22, color: colors.text.tertiary }}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screenPadding, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {filtered.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => { onSelect(cat); closeSheet(); }}
                  activeOpacity={0.75}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 14, paddingVertical: 10,
                    backgroundColor: colors.bg.input, borderRadius: radius.chip,
                    borderWidth: 1.5, borderColor: colors.system.border,
                  }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
                  <Text style={{ fontSize: 14, color: colors.text.primary }}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function RecurringFormSheet({
  visible,
  editTarget,
  onClose,
}: {
  visible: boolean;
  editTarget: RecurringRule | null;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const queryClient = useQueryClient();
  const isEditMode = editTarget !== null;

  const [name, setName] = useState('');
  const [type, setType] = useState<RuleType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>('KRW');
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
    enabled: visible,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('/categories'),
    enabled: visible,
  });

  useEffect(() => {
    if (visible) {
      if (isEditMode && editTarget) {
        setName(editTarget.name);
        setType(editTarget.type);
        setAmountStr(String(editTarget.amount));
        setCurrency(editTarget.currency);
        setSelectedAccount(
          editTarget.accountId
            ? { id: editTarget.accountId, name: editTarget.accountName ?? '', currency: editTarget.currency, balance: 0 }
            : null
        );
        setSelectedCategory(
          editTarget.categoryId
            ? { id: editTarget.categoryId, name: editTarget.categoryName ?? '', type: editTarget.type, color: '#9CA3AF' }
            : null
        );
        setDayOfMonth(String(editTarget.dayOfMonth));
      } else {
        setName('');
        setType('EXPENSE');
        setAmountStr('');
        setCurrency('KRW');
        setSelectedAccount(null);
        setSelectedCategory(null);
        setDayOfMonth('1');
      }
      Animated.timing(translateY, {
        toValue: 0, duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_H);
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, { toValue: SHEET_H, duration: 220, useNativeDriver: true })
      .start(() => onClose());
  }

  const { mutateAsync: createRule, isPending: isCreating } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/recurring-rules', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  const { mutateAsync: updateRule, isPending: isUpdating } = useMutation({
    mutationFn: (body: object) =>
      apiClient(`/recurring-rules/${editTarget!.id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  const isPending = isCreating || isUpdating;

  async function handleSave() {
    if (!name.trim()) { showAlert('', '규칙 이름을 입력해주세요.'); return; }
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) { showAlert('', '금액을 입력해주세요.'); return; }
    if (!isEditMode && !selectedAccount) { showAlert('', '계좌를 선택해주세요.'); return; }
    if (!selectedCategory) { showAlert('', '카테고리를 선택해주세요.'); return; }
    const day = parseInt(dayOfMonth, 10);
    if (!day || day < 1 || day > 28) { showAlert('', '실행일은 1~28 사이로 입력해주세요.'); return; }

    try {
      if (isEditMode) {
        await updateRule({
          name: name.trim(),
          title: name.trim(),
          amount,
          categoryId: selectedCategory.id,
          frequency: 'MONTHLY',
          dayOfMonth: day,
        });
      } else {
        const today = new Date().toISOString().split('T')[0];
        await createRule({
          name: name.trim(),
          title: name.trim(),
          type,
          amount,
          currency,
          accountId: selectedAccount!.id,
          categoryId: selectedCategory.id,
          frequency: 'MONTHLY',
          dayOfMonth: day,
          startDate: today,
        });
      }
      closeSheet();
      showAlert('완료', isEditMode ? '고정 거래가 수정되었습니다.' : '고정 거래가 추가되었습니다.');
    } catch {
      showAlert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  return (
    <>
      <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bg.overlay }} activeOpacity={1} onPress={closeSheet} />
          <Animated.View style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
            backgroundColor: colors.bg.screen,
            borderTopLeftRadius: radius.bottom, borderTopRightRadius: radius.bottom,
            transform: [{ translateY }],
          }}>
            <View style={{ alignItems: 'center', paddingTop: 10 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
            </View>
            <ScrollView
              contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text.primary, marginBottom: 20 }}>
                {isEditMode ? '고정 거래 수정' : '고정 거래 추가'}
              </Text>

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>규칙 이름</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="예: 월세, 넷플릭스"
                placeholderTextColor={colors.text.tertiary}
                style={{
                  fontSize: 16, color: colors.text.primary,
                  backgroundColor: colors.bg.input, borderRadius: radius.input,
                  padding: 14, marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>유형</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {(['EXPENSE', 'INCOME'] as RuleType[]).map((t) => {
                  const active = type === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { if (!isEditMode) setType(t); }}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: radius.chip,
                        backgroundColor: active ? colors.bg.surface : 'transparent',
                        alignItems: 'center', borderWidth: 1.5,
                        borderColor: active ? colors.text.brand : colors.system.border,
                        opacity: isEditMode ? 0.5 : 1,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: active ? colors.text.brand : colors.text.tertiary }}>
                        {TYPE_LABELS[t]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>금액</Text>
              <TextInput
                value={amountStr}
                onChangeText={setAmountStr}
                placeholder="0"
                placeholderTextColor={colors.text.tertiary}
                keyboardType="decimal-pad"
                style={{
                  fontSize: 16, color: colors.text.primary,
                  backgroundColor: colors.bg.input, borderRadius: radius.input,
                  padding: 14, marginBottom: 16,
                }}
              />

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>통화</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                {CURRENCIES.map((c) => {
                  const active = currency === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={{
                        flex: 1, paddingVertical: 10, borderRadius: radius.chip,
                        backgroundColor: active ? colors.currency[c].bg : 'transparent',
                        alignItems: 'center', borderWidth: 1.5,
                        borderColor: active ? colors.currency[c].primary : colors.system.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: active ? colors.currency[c].text : colors.text.tertiary }}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>계좌</Text>
              <TouchableOpacity
                onPress={() => setShowAccountPicker(true)}
                style={{
                  padding: 14, borderRadius: radius.input,
                  backgroundColor: colors.bg.input, marginBottom: 16,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                {selectedAccount ? (
                  <>
                    <Text style={{ fontSize: 18, marginRight: 8 }}>{CURRENCY_FLAGS[selectedAccount.currency]}</Text>
                    <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary }}>{selectedAccount.name}</Text>
                  </>
                ) : (
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text.tertiary }}>계좌 선택</Text>
                )}
                <Text style={{ color: colors.text.tertiary }}>›</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>카테고리</Text>
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(true)}
                style={{
                  padding: 14, borderRadius: radius.input,
                  backgroundColor: colors.bg.input, marginBottom: 16,
                  flexDirection: 'row', alignItems: 'center',
                }}
              >
                {selectedCategory ? (
                  <>
                    <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedCategory.color, marginRight: 8 }} />
                    <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary }}>{selectedCategory.name}</Text>
                  </>
                ) : (
                  <Text style={{ flex: 1, fontSize: 15, color: colors.text.tertiary }}>카테고리 선택</Text>
                )}
                <Text style={{ color: colors.text.tertiary }}>›</Text>
              </TouchableOpacity>

              <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary, marginBottom: 8 }}>매월 실행일</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 28 }}>
                <TextInput
                  value={dayOfMonth}
                  onChangeText={setDayOfMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                  style={{
                    fontSize: 16, color: colors.text.primary,
                    backgroundColor: colors.bg.input, borderRadius: radius.input,
                    padding: 14, width: 80, textAlign: 'center',
                  }}
                />
                <Text style={{ fontSize: 14, color: colors.text.secondary, marginLeft: 10 }}>일 (1~28)</Text>
              </View>

              <TouchableOpacity onPress={handleSave} disabled={isPending} activeOpacity={0.85}>
                <LinearGradient
                  colors={isPending ? ['#E5E7EB', '#E5E7EB', '#E5E7EB'] : colors.gradient.primary}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' }}
                >
                  {isPending
                    ? <ActivityIndicator color={colors.text.inverse} />
                    : <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.inverse }}>저장하기</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <AccountPickerSheet
        visible={showAccountPicker}
        accounts={accounts}
        onSelect={(acc) => { setSelectedAccount(acc); setCurrency(acc.currency); }}
        onClose={() => setShowAccountPicker(false)}
      />
      <CategoryPickerSheet
        visible={showCategoryPicker}
        categories={categories}
        ruleType={type}
        onSelect={setSelectedCategory}
        onClose={() => setShowCategoryPicker(false)}
      />
    </>
  );
}

export default function RecurringScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringRule | null>(null);

  function openEdit(rule: RecurringRule) {
    setEditTarget(rule);
    setFormVisible(true);
  }

  function openCreate() {
    setEditTarget(null);
    setFormVisible(true);
  }

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['recurring-rules'],
    queryFn: () => apiClient<RecurringRule[]>('/recurring-rules'),
  });

  const { mutateAsync: executeRule } = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/recurring-rules/${id}/execute`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-rules'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const { mutateAsync: deleteRule } = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/recurring-rules/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-rules'] }),
  });

  function handleExecute(rule: RecurringRule) {
    showAlert(
      '즉시 실행',
      `"${rule.name}" 규칙을 지금 실행할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '실행',
          onPress: async () => {
            try {
              await executeRule(rule.id);
              showAlert('완료', '거래가 등록되었어요.');
            } catch {
              showAlert('오류', '실행에 실패했어요.');
            }
          },
        },
      ]
    );
  }

  function handleDelete(rule: RecurringRule) {
    showAlert(
      '삭제',
      `"${rule.name}"을(를) 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            try {
              await deleteRule(rule.id);
              showAlert('완료', '고정 거래가 삭제되었습니다.');
            } catch {
              showAlert('오류', '삭제에 실패했어요.');
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
          <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
          고정 거래 관리
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}>
          {rules.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
              <Text style={{ fontSize: 40 }}>🔁</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.secondary }}>
                고정 거래가 없어요
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.tertiary, textAlign: 'center' }}>
                매달 반복되는 거래를{'\n'}자동으로 등록해보세요.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 12, marginBottom: 20 }}>
              {rules.map((rule) => (
                <View
                  key={rule.id}
                  style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.card,
                    padding: 16,
                    ...shadow.card,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ flex: 1, fontSize: 15, fontWeight: '700', color: colors.text.primary }}>
                      {rule.name}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 4,
                      backgroundColor: colors.bg.input, borderRadius: radius.chip,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                        {TYPE_LABELS[rule.type]}
                      </Text>
                    </View>
                    <View style={{
                      paddingHorizontal: 8, paddingVertical: 4,
                      backgroundColor: colors.bg.input, borderRadius: radius.chip,
                    }}>
                      <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                        매월 {rule.dayOfMonth}일
                      </Text>
                    </View>
                    {rule.nextExecutionDate && (
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 4,
                        backgroundColor: colors.bg.input, borderRadius: radius.chip,
                      }}>
                        <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                          다음 {rule.nextExecutionDate}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text.primary, marginBottom: 14 }}>
                    {formatCurrency(rule.amount, rule.currency)}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => openEdit(rule)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: radius.chip,
                        backgroundColor: colors.bg.input, alignItems: 'center',
                        borderWidth: 1, borderColor: colors.system.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: colors.text.brand }}>수정</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleExecute(rule)}
                      activeOpacity={0.75}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: radius.chip,
                        backgroundColor: colors.bg.input, alignItems: 'center',
                        borderWidth: 1, borderColor: colors.system.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: colors.text.brand }}>즉시 실행</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(rule)}
                      activeOpacity={0.75}
                      style={{
                        paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.chip,
                        backgroundColor: colors.bg.input, alignItems: 'center',
                        borderWidth: 1, borderColor: colors.system.border,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: colors.loss.text }}>삭제</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={openCreate}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: radius.button, paddingVertical: 14,
                alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 6,
              }}
            >
              <Text style={{ fontSize: 18, color: colors.text.inverse }}>+</Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.inverse }}>
                고정 거래 추가
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}

      <RecurringFormSheet
        visible={formVisible}
        editTarget={editTarget}
        onClose={() => setFormVisible(false)}
      />
    </SafeAreaView>
  );
}
