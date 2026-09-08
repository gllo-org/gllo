import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.7;

type TxType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE';

interface Category {
  id: string;
  name: string;
  type: 'SYSTEM' | 'CUSTOM';
}

interface TransactionDetail {
  id: string;
  title: string;
  type: TxType;
  amount: number;
  currency: CurrencyCode;
  categoryId: string | null;
  categoryName: string | null;
  categoryEmoji: string | null;
  accountId: string;
  accountName: string;
  transactionDate: string;
  note: string | null;
  isTrip: boolean;
  tripId: number | null;
}

interface ExchangeRateEntry {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
}

const TYPE_CONFIG: Record<TxType, { label: string; color: string; bg: string; prefix: string }> = {
  EXPENSE:  { label: '지출', color: colors.loss.text,   bg: colors.loss.light,   prefix: '-' },
  INCOME:   { label: '수입', color: colors.profit.text, bg: colors.profit.light, prefix: '+' },
  TRANSFER: { label: '이체', color: colors.text.brand,  bg: colors.bg.surface,   prefix: '' },
  EXCHANGE: { label: '환전', color: colors.text.brand,  bg: colors.bg.surface,   prefix: '↕' },
};

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

function DetailRow({ icon, label, value, isLast }: {
  icon: string; label: string; value: string; isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'flex-start',
      padding: 16,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.system.divider,
    }}>
      <Text style={{ fontSize: 18, width: 32 }}>{icon}</Text>
      <Text style={{ fontSize: 13, color: colors.text.secondary, width: 56, lineHeight: 22 }}>{label}</Text>
      <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary, lineHeight: 22 }}>{value}</Text>
    </View>
  );
}

function EditRow({ icon, label, value, onChangeText, placeholder, keyboardType, maxLength, isLast }: {
  icon: string;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  keyboardType?: 'decimal-pad' | 'numbers-and-punctuation' | 'default';
  maxLength?: number;
  isLast?: boolean;
}) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      padding: 16,
      borderBottomWidth: isLast ? 0 : 1,
      borderBottomColor: colors.system.divider,
    }}>
      <Text style={{ fontSize: 18, width: 32 }}>{icon}</Text>
      <Text style={{ fontSize: 13, color: colors.text.secondary, width: 56 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        keyboardType={keyboardType ?? 'default'}
        maxLength={maxLength}
        returnKeyType="done"
        style={{ flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 }}
      />
    </View>
  );
}

function CategoryPickerSheet({ visible, categories, isLoadingCats, selectedId, onSelect, onClose }: {
  visible: boolean;
  categories: Category[];
  isLoadingCats: boolean;
  selectedId: string | null;
  onSelect: (cat: Category) => void;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(SHEET_H);
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, {
      toValue: SHEET_H,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
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
              카테고리 선택
            </Text>
            <TouchableOpacity onPress={closeSheet} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 22, color: colors.text.tertiary, lineHeight: 26 }}>×</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {isLoadingCats ? (
              <View style={{ alignItems: 'center', paddingTop: 40 }}>
                <ActivityIndicator color={colors.text.brand} />
              </View>
            ) : categories.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 40, gap: 12 }}>
                <Text style={{ fontSize: 36 }}>💸</Text>
                <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>
                  카테고리가 없어요.
                </Text>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {categories.map((cat) => {
                  const emoji = categoryEmoji(cat.name);
                  const active = selectedId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => { onSelect(cat); closeSheet(); }}
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
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editCategoryLabel, setEditCategoryLabel] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const { data: tx, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => apiClient<TransactionDetail>(`/transactions/${id}`),
  });

  const { data: categories = [], isLoading: isLoadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('/categories'),
    enabled: isEditing,
  });

  const { data: rateEntry } = useQuery({
    queryKey: ['exchange-rate', tx?.currency, 'KRW'],
    queryFn: () => apiClient<ExchangeRateEntry>(`/exchange-rates/${tx!.currency}/KRW`),
    enabled: !!tx && tx.currency !== 'KRW',
    staleTime: 1000 * 60 * 10,
  });
  const krwRate = rateEntry?.rate ?? null;

  const { mutateAsync: updateTx, isPending: isUpdating } = useMutation({
    mutationFn: (body: object) =>
      apiClient(`/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const { mutateAsync: deleteTx, isPending: isDeleting } = useMutation({
    mutationFn: () => apiClient(`/transactions/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function startEdit() {
    if (!tx) return;
    setEditTitle(tx.title);
    setEditAmount(String(tx.amount));
    setEditCategoryId(tx.categoryId);
    setEditCategoryLabel(
      tx.categoryName
        ? `${tx.categoryEmoji ?? categoryEmoji(tx.categoryName)} ${tx.categoryName}`
        : null
    );
    setEditDate(tx.transactionDate);
    setEditNote(tx.note ?? '');
    setIsEditing(true);
  }

  async function handleSave() {
    const amount = parseFloat(editAmount);
    if (!amount || amount <= 0) {
      showAlert('', '금액을 올바르게 입력해주세요.');
      return;
    }
    try {
      await updateTx({
        title: editTitle || undefined,
        amount,
        categoryId: editCategoryId ?? undefined,
        tripId: tx?.tripId ?? undefined,
        transactionDate: editDate,
        note: editNote || null,
      });
      setIsEditing(false);
    } catch {
      showAlert('오류', '수정에 실패했어요. 다시 시도해주세요.');
    }
  }

  function handleDelete() {
    showAlert(
      '거래 삭제',
      '이 거래를 삭제할까요? 계좌 잔액이 원래대로 돌아가요.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTx();
              router.back();
            } catch {
              showAlert('오류', '삭제에 실패했어요. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator color={colors.text.brand} />
          <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
            글로가 데이터를 불러오고 있어요...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!tx) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 36 }}>⚠️</Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary }}>거래를 찾을 수 없어요.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 14, color: colors.text.brand, fontWeight: '600' }}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = TYPE_CONFIG[tx.type];
  const isEditable = tx.type !== 'EXCHANGE';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: spacing.screenPadding, paddingTop: 16, paddingBottom: 12,
      }}>
        <TouchableOpacity
          onPress={isEditing ? () => setIsEditing(false) : () => router.back()}
          style={{ padding: 8, marginLeft: -8 }}
        >
          <Text style={{ fontSize: isEditing ? 15 : 22, color: colors.text.primary, fontWeight: isEditing ? '500' : '400' }}>
            {isEditing ? '취소' : '←'}
          </Text>
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
          {isEditing ? '거래 수정' : '거래 상세'}
        </Text>
        {isEditable ? (
          isEditing ? (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isUpdating}
              style={{ padding: 8, marginRight: -8 }}
            >
              {isUpdating
                ? <ActivityIndicator size="small" color={colors.text.brand} />
                : <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.brand }}>저장</Text>
              }
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startEdit} style={{ padding: 8, marginRight: -8 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.brand }}>편집</Text>
            </TouchableOpacity>
          )
        ) : (
          <View style={{ width: 46 }} />
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{
          backgroundColor: cfg.bg,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          alignItems: 'center',
          marginBottom: 20,
          ...shadow.card,
        }}>
          <View style={{
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: radius.chip,
            backgroundColor: cfg.color + '18',
            marginBottom: 12,
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.color }}>{cfg.label}</Text>
          </View>
          <Text style={{
            fontSize: 36, fontWeight: '700', letterSpacing: -1, color: cfg.color,
          }}>
            {cfg.prefix}{formatCurrency(tx.amount, tx.currency)}
          </Text>
          {tx.currency !== 'KRW' && krwRate !== null && (
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginTop: 4 }}>
              ≈ {formatCurrency(tx.amount * krwRate, 'KRW')}
            </Text>
          )}
          {tx.categoryEmoji && (
            <Text style={{ fontSize: 32, marginTop: 12 }}>{tx.categoryEmoji}</Text>
          )}
        </View>

        <View style={{
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          overflow: 'hidden',
          marginBottom: 20,
          ...shadow.card,
        }}>
          {!isEditing ? (
            <>
              <DetailRow icon="📌" label="항목명" value={tx.title} />
              {tx.categoryName && (
                <DetailRow
                  icon={tx.categoryEmoji ?? '🏷️'}
                  label="카테고리"
                  value={tx.categoryName}
                />
              )}
              <DetailRow icon="🏦" label="계좌" value={tx.accountName} />
              <DetailRow icon="📅" label="날짜" value={tx.transactionDate} isLast={!tx.note} />
              {tx.note && <DetailRow icon="📝" label="메모" value={tx.note} isLast />}
            </>
          ) : (
            <>
              <EditRow
                icon="📌" label="항목명"
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="항목명을 입력하세요"
              />
              <EditRow
                icon="💰" label="금액"
                value={editAmount}
                onChangeText={setEditAmount}
                keyboardType="decimal-pad"
                placeholder="금액을 입력하세요"
              />
              <TouchableOpacity
                onPress={() => setShowCategoryPicker(true)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row', alignItems: 'center',
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.system.divider,
                }}
              >
                <Text style={{ fontSize: 18, width: 32 }}>🏷️</Text>
                <Text style={{ fontSize: 13, color: colors.text.secondary, width: 56 }}>카테고리</Text>
                <Text style={{
                  flex: 1, fontSize: 15, fontWeight: '500',
                  color: editCategoryId ? colors.text.primary : colors.text.tertiary,
                }}>
                  {editCategoryLabel ?? '선택하세요'}
                </Text>
                <Text style={{ fontSize: 18, color: colors.text.tertiary }}>›</Text>
              </TouchableOpacity>
              <EditRow
                icon="📅" label="날짜"
                value={editDate}
                onChangeText={setEditDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
                maxLength={10}
              />
              <EditRow
                icon="📝" label="메모"
                value={editNote}
                onChangeText={setEditNote}
                placeholder="메모 (선택)"
                isLast
              />
            </>
          )}
        </View>

        {!isEditing && isEditable && (
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            activeOpacity={0.8}
            style={{
              borderWidth: 1.5,
              borderColor: colors.loss.text,
              borderRadius: radius.button,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {isDeleting
              ? <ActivityIndicator color={colors.loss.text} />
              : <Text style={{ fontSize: 15, fontWeight: '600', color: colors.loss.text }}>
                  거래 삭제
                </Text>
            }
          </TouchableOpacity>
        )}
      </ScrollView>

      <CategoryPickerSheet
        visible={showCategoryPicker}
        categories={categories}
        isLoadingCats={isLoadingCats}
        selectedId={editCategoryId}
        onSelect={(cat) => {
          setEditCategoryId(cat.id);
          setEditCategoryLabel(`${categoryEmoji(cat.name)} ${cat.name}`);
        }}
        onClose={() => setShowCategoryPicker(false)}
      />
    </SafeAreaView>
  );
}
