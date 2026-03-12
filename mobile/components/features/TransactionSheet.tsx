import { useRef, useEffect, useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, TextInput,
  Animated, Easing, Dimensions, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow } from '@/theme';
import type { CurrencyCode } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.92;

type TxType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'EXCHANGE';
type SheetView = 'main' | 'category' | 'account';

interface Category {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  systemCategory: boolean;
}

interface Account {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
}

interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  rateDate: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TYPE_CONFIG: Record<TxType, { label: string; color: string; prefix: string }> = {
  EXPENSE:  { label: '지출',   color: colors.loss.text,   prefix: '-' },
  INCOME:   { label: '수입',   color: colors.profit.text, prefix: '+' },
  TRANSFER: { label: '이체',   color: colors.text.brand,  prefix: '' },
  EXCHANGE: { label: '환전',   color: colors.currency.EUR.text, prefix: '⇄' },
};

const CURRENCIES: CurrencyCode[] = ['EUR', 'USD', 'GBP', 'KRW'];

const CATEGORY_EMOJI: Record<string, string> = {
  '식비': '🍜', '교통': '🚇', '주거비': '🏠', '의류': '👕',
  '의료': '🏥', '건강': '🏥', '교육': '📚', '문화': '🎭',
  '통신': '📱', '보험': '🛡️', '용돈': '💰', '여행': '✈️',
  '비자': '📋', '보증금': '🏦', '항공권': '✈️', '기숙사': '🏫',
  '장학금': '🎓', '월세': '🏠', '구독': '📺', '기타': '💸',
};

function categoryEmoji(name: string): string {
  for (const [k, v] of Object.entries(CATEGORY_EMOJI)) {
    if (name.includes(k)) return v;
  }
  return '💸';
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const PAD_ROWS = [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['.', '0', '⌫']] as const;

function NumberPad({ onKey }: { onKey: (k: string) => void }) {
  return (
    <View style={{ paddingHorizontal: 10, paddingVertical: 4 }}>
      {PAD_ROWS.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', marginBottom: 4 }}>
          {row.map((key) => (
            <TouchableOpacity
              key={key}
              onPress={() => onKey(key)}
              activeOpacity={0.55}
              style={{
                flex: 1,
                height: 50,
                marginHorizontal: 3,
                borderRadius: radius.chip,
                backgroundColor: key === '⌫' ? colors.bg.surface : colors.bg.screen,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.system.border,
              }}
            >
              <Text style={{
                fontSize: key === '⌫' ? 18 : 20,
                fontWeight: key === '⌫' ? '400' : '500',
                color: colors.text.primary,
              }}>
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}

function SelectorRow({
  icon, label, value, onPress, dimmed,
}: {
  icon: string; label: string; value: string; onPress: () => void; dimmed?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.system.divider,
      }}
    >
      <Text style={{ fontSize: 18, width: 28 }}>{icon}</Text>
      <Text style={{ fontSize: 13, color: colors.text.secondary, width: 52 }}>{label}</Text>
      <Text style={{
        flex: 1, fontSize: 15, fontWeight: '500',
        color: dimmed ? colors.text.tertiary : colors.text.primary,
      }}>
        {value}
      </Text>
      <Text style={{ fontSize: 18, color: colors.text.tertiary }}>›</Text>
    </TouchableOpacity>
  );
}

export function TransactionSheet({ visible, onClose }: Props) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const queryClient = useQueryClient();
  const router = useRouter();

  const [txType, setTxType]           = useState<TxType>('EXPENSE');
  const [amountStr, setAmountStr]     = useState('0');
  const [currency, setCurrency]       = useState<CurrencyCode>('EUR');
  const [categoryId, setCategoryId]   = useState<string | null>(null);
  const [categoryLabel, setCategoryLbl] = useState<string | null>(null);
  const [accountId, setAccountId]     = useState<string | null>(null);
  const [accountLabel, setAccountLbl] = useState<string | null>(null);
  const [txDate, setTxDate]           = useState(todayStr());
  const [showDate, setShowDate]       = useState(false);
  const [memo, setMemo]               = useState('');
  const [view, setView]               = useState<SheetView>('main');
  const [krwOverride, setKrwOverride] = useState<string | null>(null);
  const [editingKrw, setEditingKrw]   = useState(false);
  const [newCatName, setNewCatName]   = useState('');
  const [addingCat, setAddingCat]     = useState(false);

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('/categories'),
    enabled: visible,
  });

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
    enabled: visible,
  });

  const isToday = txDate === todayStr();

  const { data: currentRate } = useQuery({
    queryKey: ['exchange-rate', currency, 'KRW'],
    queryFn: () => apiClient<ExchangeRate>(`/exchange-rates/${currency}/KRW`),
    enabled: visible && currency !== 'KRW',
    staleTime: 1000 * 60 * 10,
  });

  const { data: historicRates } = useQuery({
    queryKey: ['exchange-rate-history', txDate],
    queryFn: () => apiClient<ExchangeRate[]>(`/exchange-rates/history/${txDate}`),
    enabled: visible && currency !== 'KRW' && !isToday,
    staleTime: 1000 * 60 * 60,
  });

  const effectiveRate: number | null = (() => {
    if (currency === 'KRW') return null;
    if (isToday) return currentRate?.rate ?? null;
    const match = historicRates?.find(
      r => r.baseCurrency === currency && r.targetCurrency === 'KRW'
    );
    return match?.rate ?? currentRate?.rate ?? null;
  })();

  const amount = parseFloat(amountStr) || 0;

  const krwEstimate: number | null = (() => {
    if (currency === 'KRW' || effectiveRate === null || amount <= 0) return null;
    return Math.round(amount * effectiveRate);
  })();

  const krwDisplayStr: string | null = (() => {
    if (currency === 'KRW') return null;
    if (krwOverride !== null) return krwOverride;
    if (krwEstimate === null) return null;
    return String(krwEstimate);
  })();

  const { mutateAsync: save, isPending } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/transactions', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const { mutateAsync: createCategory, isPending: creatingCat } = useMutation({
    mutationFn: (name: string) =>
      apiClient<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify({ name, type: txType === 'INCOME' ? 'INCOME' : 'EXPENSE', color: '#6366F1' }),
      }),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      refetchCategories();
      pickCategory(newCat);
      setNewCatName('');
      setAddingCat(false);
    },
  });

  useEffect(() => {
    if (visible) {
      resetForm();
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_H);
    }
  }, [visible]);

  useEffect(() => {
    setKrwOverride(null);
  }, [amountStr, currency, txDate]);

  function resetForm() {
    setTxType('EXPENSE');
    setAmountStr('0');
    setCurrency('EUR');
    setCategoryId(null);
    setCategoryLbl(null);
    setAccountId(null);
    setAccountLbl(null);
    setTxDate(todayStr());
    setShowDate(false);
    setMemo('');
    setView('main');
    setKrwOverride(null);
    setEditingKrw(false);
    setNewCatName('');
    setAddingCat(false);
  }

  function closeSheet() {
    Animated.timing(translateY, {
      toValue: SHEET_H,
      duration: 240,
      useNativeDriver: true,
    }).start(() => onClose());
  }

  function handleKey(key: string) {
    if (key === '⌫') {
      setAmountStr(p => (p.length <= 1 ? '0' : p.slice(0, -1)));
      return;
    }
    if (key === '.') {
      if (currency === 'KRW' || amountStr.includes('.')) return;
      setAmountStr(p => p + '.');
      return;
    }
    if (amountStr.includes('.') && amountStr.split('.')[1].length >= 2) return;
    setAmountStr(p => (p === '0' ? key : p.length < 12 ? p + key : p));
  }

  async function handleSave() {
    const numAmount = parseFloat(amountStr);
    if (numAmount <= 0) { Alert.alert('', '금액을 입력해주세요.'); return; }
    if (!categoryId)  { Alert.alert('', '카테고리를 선택해주세요.'); return; }
    if (!accountId)   { Alert.alert('', '계좌를 선택해주세요.'); return; }
    const krwAmount = krwDisplayStr ? parseInt(krwDisplayStr.replace(/,/g, '')) : null;
    try {
      await save({
        type: txType,
        amount: numAmount,
        currency,
        title: categoryLabel?.replace(/^.{1,2}\s/, '') ?? txType,
        categoryId,
        accountId,
        transactionDate: txDate,
        note: memo || null,
        ...(krwAmount !== null ? { customConvertedAmount: krwAmount } : {}),
      });
      closeSheet();
      Alert.alert('완료', '거래가 추가되었습니다.');
    } catch {
      Alert.alert('오류', '거래를 저장하지 못했어요. 다시 시도해주세요.');
    }
  }

  function pickCategory(cat: Category) {
    setCategoryId(cat.id);
    setCategoryLbl(`${categoryEmoji(cat.name)} ${cat.name}`);
    setView('main');
  }

  function pickAccount(acc: Account) {
    setAccountId(acc.id);
    setAccountLbl(`${CURRENCY_FLAGS[acc.currency]} ${acc.name}`);
    setCurrency(acc.currency);
    setView('main');
  }

  async function handleAddCategory() {
    const name = newCatName.trim();
    if (!name) return;
    try {
      await createCategory(name);
    } catch {
      Alert.alert('오류', '카테고리를 추가하지 못했어요.');
    }
  }

  const filteredCategories = (() => {
    if (!categories) return [];
    if (txType === 'EXPENSE') return categories.filter(c => c.type === 'EXPENSE');
    if (txType === 'INCOME') return categories.filter(c => c.type === 'INCOME');
    return categories;
  })();

  const isValid = amount > 0 && !!categoryId && !!accountId;
  const cfg = TYPE_CONFIG[txType];

  const amountDisplay = (() => {
    const sym = { EUR: '€', USD: '$', GBP: '£', KRW: '₩' }[currency];
    const [int, dec] = amountStr.split('.');
    const formatted = parseInt(int || '0').toLocaleString();
    return dec !== undefined ? `${sym} ${formatted}.${dec}` : `${sym} ${formatted}`;
  })();

  const dateDisplay = txDate === todayStr() ? '오늘' : txDate;

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
          {/* Handle bar */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>

          {/* Header */}
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.screenPadding, paddingVertical: 10,
          }}>
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
              {view === 'category' ? '카테고리 선택' : view === 'account' ? '계좌 선택' : '새 거래 추가'}
            </Text>
            <TouchableOpacity
              onPress={view === 'main' ? closeSheet : () => { setView('main'); setAddingCat(false); setNewCatName(''); }}
              style={{ padding: 6 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 22, color: colors.text.tertiary, lineHeight: 26 }}>
                {view === 'main' ? '×' : '←'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── MAIN VIEW ── */}
          {view === 'main' && (
            <>
              {/* Type segment */}
              <View style={{
                flexDirection: 'row',
                marginHorizontal: spacing.screenPadding,
                backgroundColor: colors.bg.surface,
                borderRadius: radius.chip,
                padding: 3,
                marginBottom: 10,
              }}>
                {(['EXPENSE', 'INCOME', 'TRANSFER', 'EXCHANGE'] as TxType[]).map((t) => {
                  const active = txType === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => {
                        if (t === 'EXCHANGE') {
                          closeSheet();
                          setTimeout(() => router.push('/exchange'), 260);
                          return;
                        }
                        setTxType(t);
                        setCategoryId(null);
                        setCategoryLbl(null);
                      }}
                      style={{
                        flex: 1, paddingVertical: 8, borderRadius: 10,
                        backgroundColor: active ? colors.bg.screen : 'transparent',
                        alignItems: 'center',
                        ...(active ? shadow.card : {}),
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                        color: active ? TYPE_CONFIG[t].color : colors.text.tertiary,
                      }}>
                        {TYPE_CONFIG[t].label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Currency chips */}
              <View style={{
                flexDirection: 'row', gap: 6,
                paddingHorizontal: spacing.screenPadding, marginBottom: 8,
              }}>
                {CURRENCIES.map((c) => {
                  const cc = colors.currency[c];
                  const active = currency === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setCurrency(c)}
                      style={{
                        flex: 1, paddingVertical: 7,
                        borderRadius: radius.chip,
                        backgroundColor: active ? cc.bg : colors.bg.surface,
                        alignItems: 'center',
                        borderWidth: active ? 1.5 : 1,
                        borderColor: active ? cc.primary : colors.system.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 12, fontWeight: '600',
                        color: active ? cc.text : colors.text.tertiary,
                      }}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Amount display */}
              <View style={{
                alignItems: 'center', paddingTop: 10, paddingBottom: 4,
                borderBottomWidth: 1, borderBottomColor: colors.system.divider,
                marginBottom: 2,
              }}>
                <Text style={{
                  fontSize: 40, fontWeight: '700', letterSpacing: -1,
                  color: amount > 0 ? cfg.color : colors.text.tertiary,
                }}>
                  {cfg.prefix}{amountDisplay}
                </Text>

                {currency !== 'KRW' && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingKrw(true);
                      if (krwOverride === null && krwEstimate !== null) {
                        setKrwOverride(String(krwEstimate));
                      }
                    }}
                    activeOpacity={0.7}
                    style={{ marginTop: 4, marginBottom: 6 }}
                  >
                    {editingKrw ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 13, color: colors.text.tertiary }}>≈ ₩</Text>
                        <TextInput
                          value={krwOverride ?? ''}
                          onChangeText={setKrwOverride}
                          keyboardType="number-pad"
                          style={{
                            fontSize: 13, color: colors.text.secondary,
                            borderBottomWidth: 1, borderBottomColor: colors.text.brand,
                            minWidth: 80, paddingVertical: 2,
                          }}
                          onBlur={() => setEditingKrw(false)}
                          autoFocus
                        />
                        <TouchableOpacity onPress={() => setEditingKrw(false)}>
                          <Text style={{ fontSize: 12, color: colors.text.brand }}>완료</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
                        ≈ {krwDisplayStr !== null
                          ? `₩${parseInt(krwDisplayStr).toLocaleString()}`
                          : '환율 로딩 중…'}
                        {krwOverride !== null && <Text style={{ color: colors.text.brand }}> (수정됨)</Text>}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Info rows */}
              <ScrollView
                style={{ flex: 1 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <View style={{ paddingHorizontal: spacing.screenPadding }}>
                  <SelectorRow
                    icon="🏷️" label="카테고리"
                    value={categoryLabel ?? '선택하세요'}
                    dimmed={!categoryId}
                    onPress={() => setView('category')}
                  />
                  <SelectorRow
                    icon="🏦" label="계좌"
                    value={accountLabel ?? '선택하세요'}
                    dimmed={!accountId}
                    onPress={() => setView('account')}
                  />

                  {/* Date row */}
                  <TouchableOpacity
                    onPress={() => setShowDate(!showDate)}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 15,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.system.divider,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, width: 28 }}>📅</Text>
                      <Text style={{ fontSize: 13, color: colors.text.secondary, width: 52 }}>날짜</Text>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: '500', color: colors.text.primary }}>
                        {dateDisplay}
                      </Text>
                      <Text style={{ fontSize: 18, color: colors.text.tertiary }}>›</Text>
                    </View>
                    {showDate && (
                      <TextInput
                        value={txDate}
                        onChangeText={setTxDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.text.tertiary}
                        keyboardType="numbers-and-punctuation"
                        maxLength={10}
                        style={{
                          marginTop: 10, marginLeft: 80,
                          fontSize: 15, color: colors.text.primary,
                          backgroundColor: colors.bg.input,
                          borderRadius: radius.input,
                          paddingHorizontal: 12, paddingVertical: 8,
                        }}
                      />
                    )}
                  </TouchableOpacity>

                  {/* Memo row */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 13,
                  }}>
                    <Text style={{ fontSize: 18, width: 28 }}>📝</Text>
                    <Text style={{ fontSize: 13, color: colors.text.secondary, width: 52 }}>메모</Text>
                    <TextInput
                      value={memo}
                      onChangeText={setMemo}
                      placeholder="메모 (선택)"
                      placeholderTextColor={colors.text.tertiary}
                      returnKeyType="done"
                      style={{ flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 }}
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Number pad */}
              <NumberPad onKey={handleKey} />

              {/* Save button */}
              <View style={{
                paddingHorizontal: spacing.screenPadding,
                paddingTop: 6, paddingBottom: 28,
              }}>
                <TouchableOpacity onPress={handleSave} disabled={!isValid || isPending} activeOpacity={0.85}>
                  <LinearGradient
                    colors={isValid && !isPending
                      ? colors.gradient.primary
                      : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ borderRadius: radius.button, paddingVertical: 15, alignItems: 'center' }}
                  >
                    {isPending
                      ? <ActivityIndicator color={colors.text.inverse} />
                      : <Text style={{
                          fontSize: 16, fontWeight: '600',
                          color: isValid ? colors.text.inverse : colors.text.tertiary,
                        }}>
                          저장하기
                        </Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── CATEGORY PICKER ── */}
          {view === 'category' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Inline add category */}
              {addingCat ? (
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  backgroundColor: colors.bg.surface,
                  borderRadius: radius.card,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1.5,
                  borderColor: colors.text.brand,
                }}>
                  <TextInput
                    value={newCatName}
                    onChangeText={setNewCatName}
                    placeholder="카테고리 이름"
                    placeholderTextColor={colors.text.tertiary}
                    style={{ flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 }}
                    autoFocus
                    maxLength={20}
                    returnKeyType="done"
                    onSubmitEditing={handleAddCategory}
                  />
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    disabled={creatingCat || !newCatName.trim()}
                    style={{
                      backgroundColor: newCatName.trim() ? colors.text.brand : colors.system.border,
                      borderRadius: radius.chip,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
                      {creatingCat ? '...' : '추가'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setAddingCat(false); setNewCatName(''); }}>
                    <Text style={{ fontSize: 13, color: colors.text.tertiary }}>취소</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => setAddingCat(true)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 6,
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.card,
                    padding: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: colors.system.border,
                    borderStyle: 'dashed',
                  }}
                >
                  <Text style={{ fontSize: 16, color: colors.text.brand }}>+</Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text.brand }}>
                    카테고리 추가
                  </Text>
                </TouchableOpacity>
              )}

              {filteredCategories.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
                  <Text style={{ fontSize: 36 }}>💸</Text>
                  <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
                    아직 카테고리가 없어요.{'\n'}위의 버튼으로 첫 카테고리를 만들어보세요.
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {filteredCategories.map((cat) => {
                    const emoji = categoryEmoji(cat.name);
                    const active = categoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        onPress={() => pickCategory(cat)}
                        activeOpacity={0.75}
                        style={{
                          width: '30%',
                          aspectRatio: 1,
                          borderRadius: radius.card,
                          backgroundColor: active ? colors.gradient.primary[0] + '20' : colors.bg.surface,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? colors.text.brand : colors.system.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          ...(active ? shadow.card : {}),
                        }}
                      >
                        <Text style={{ fontSize: 26 }}>{emoji}</Text>
                        <Text style={{
                          fontSize: 12, fontWeight: '500', textAlign: 'center',
                          color: active ? colors.text.brand : colors.text.primary,
                        }}>
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}

          {/* ── ACCOUNT PICKER ── */}
          {view === 'account' && (
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <TouchableOpacity
                onPress={() => {
                  closeSheet();
                  setTimeout(() => router.push('/accounts'), 260);
                }}
                style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                  gap: 6,
                  backgroundColor: colors.bg.surface,
                  borderRadius: radius.card,
                  padding: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: colors.system.border,
                  borderStyle: 'dashed',
                }}
              >
                <Text style={{ fontSize: 16, color: colors.text.brand }}>+</Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text.brand }}>
                  새 계좌 만들기
                </Text>
              </TouchableOpacity>

              {!accounts || accounts.length === 0 ? (
                <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
                  <Text style={{ fontSize: 36 }}>🏦</Text>
                  <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
                    계좌가 없어요.{'\n'}위 버튼으로 먼저 계좌를 만들어보세요.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {accounts.map((acc) => {
                    const cc = colors.currency[acc.currency];
                    const active = accountId === acc.id;
                    return (
                      <TouchableOpacity
                        key={acc.id}
                        onPress={() => pickAccount(acc)}
                        activeOpacity={0.75}
                        style={{
                          flexDirection: 'row', alignItems: 'center',
                          padding: 16,
                          borderRadius: radius.card,
                          backgroundColor: active ? cc.bg : colors.bg.surface,
                          borderWidth: active ? 2 : 1,
                          borderColor: active ? cc.primary : colors.system.border,
                          ...(active ? shadow.card : {}),
                        }}
                      >
                        <Text style={{ fontSize: 26, marginRight: 12 }}>{CURRENCY_FLAGS[acc.currency]}</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 15, fontWeight: '600',
                            color: active ? cc.text : colors.text.primary,
                          }}>
                            {acc.name}
                          </Text>
                          <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                            {formatCurrency(acc.balance, acc.currency)}
                          </Text>
                        </View>
                        {active && (
                          <View style={{
                            width: 22, height: 22, borderRadius: 11,
                            backgroundColor: cc.primary,
                            alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
