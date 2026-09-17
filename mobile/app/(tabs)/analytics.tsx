import { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Dimensions,
  Animated, Easing, Modal, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import { getYearMonth } from '@/lib/utils/date';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { X, Inbox, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHEET_H = Dimensions.get('window').height * 0.65;

type AnalyticsTab = '추이' | '카테고리별';
type CategoryType = '지출' | '수입';
type ViewMode = '이번 달' | '3개월' | '6개월';
type AmountType = '전체' | '지출' | '수입';

interface MonthlyReport {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  currency: CurrencyCode;
  categoryExpenses: CategoryExpense[];
  categoryIncomes: CategoryExpense[];
  dailyExpenses: DailyExpense[];
}

interface CategoryExpense {
  categoryName: string;
  categoryEmoji: string;
  amount: number;
  percentage: number;
}

interface DailyExpense {
  date: string;
  amount: number;
}

interface Transaction {
  id: string;
  title: string;
  type: string;
  amount: number;
  currency: CurrencyCode;
  categoryName: string;
  categoryEmoji: string;
  transactionDate: string;
}

interface TransactionPage {
  content: Transaction[];
  hasNext: boolean;
  page: number;
}

const CHART_COLORS = [
  '#C4B5F8', '#F0A8C8', '#FFBDA0',
  '#86EFAC', '#93C5FD', '#FCD34D',
  '#A5B4FC', '#F9A8D4', '#6EE7B7',
];

function getYearMonthsBack(baseYearMonth: string, count: number): string[] {
  const [y, m] = baseYearMonth.split('-').map(Number);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(y, m - 1 - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

function MonthPicker({ yearMonth, onChange }: { yearMonth: string; onChange: (ym: string) => void }) {
  function shift(delta: number) {
    const [y, m] = yearMonth.split('-').map(Number);
    const date = new Date(y, m - 1 + delta, 1);
    onChange(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  const [year, month] = yearMonth.split('-');
  const isFuture = yearMonth > getYearMonth();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
      <TouchableOpacity onPress={() => shift(-1)} style={{ padding: 8 }}>
        <ChevronLeft size={20} color={colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>
      <Text style={{ fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
        {year}년 {Number(month)}월
      </Text>
      <TouchableOpacity onPress={() => shift(1)} disabled={isFuture} style={{ padding: 8 }}>
        <ChevronRight size={20} color={isFuture ? colors.text.tertiary : colors.text.primary} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

function CategoryDrilldownSheet({
  visible,
  category,
  yearMonth,
  currency,
  onClose,
}: {
  visible: boolean;
  category: CategoryExpense | null;
  yearMonth: string;
  currency: CurrencyCode;
  onClose: () => void;
}) {
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const [year, month] = yearMonth.split('-').map(Number);

  useEffect(() => {
    if (visible) {
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

  const { data: txPage, isLoading } = useQuery({
    queryKey: ['transactions-month', year, month],
    queryFn: () => apiClient<TransactionPage>(`/transactions?year=${year}&month=${month}&size=500`),
    enabled: visible && !!category,
  });

  const filtered = (txPage?.content ?? []).filter(
    (tx) => tx.categoryName === category?.categoryName
  );

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
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: spacing.screenPadding, paddingVertical: 12,
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
                {category?.categoryEmoji} {category?.categoryName}
              </Text>
              <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 2 }}>
                {year}년 {month}월 · {formatCurrency(category?.amount ?? 0, currency)}
              </Text>
            </View>
            <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={colors.text.tertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator color={colors.text.brand} />
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <Inbox size={32} color={colors.text.tertiary} strokeWidth={1.6} />
              <Text style={{ fontSize: 14, color: colors.text.secondary }}>해당 카테고리 거래가 없어요.</Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: spacing.screenPadding, paddingBottom: 32 }}
              renderItem={({ item }) => (
                <View style={{
                  flexDirection: 'row', alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.system.divider,
                }}>
                  <Text style={{ fontSize: 20, marginRight: 12 }}>{item.categoryEmoji || '💸'}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: 'Pretendard-Medium', color: colors.text.primary }}>
                      {item.title}
                    </Text>
                    <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 2 }}>
                      {item.transactionDate}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.loss.text }}>
                    -{formatCurrency(item.amount, item.currency)}
                  </Text>
                </View>
              )}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function TrendTab({
  baseYearMonth,
  onChangeYearMonth,
}: {
  baseYearMonth: string;
  onChangeYearMonth: (ym: string) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('이번 달');
  const [amountType, setAmountType] = useState<AmountType>('전체');

  const monthCount = viewMode === '3개월' ? 3 : viewMode === '6개월' ? 6 : 1;
  const yearMonths = viewMode === '이번 달'
    ? [baseYearMonth]
    : getYearMonthsBack(getYearMonth(), monthCount);

  const { data: singleReport, isLoading: isSingleLoading } = useQuery({
    queryKey: ['report', baseYearMonth],
    queryFn: () => apiClient<MonthlyReport>(`/reports/monthly/${baseYearMonth}`),
    enabled: viewMode === '이번 달',
  });

  const { data: multiReports, isLoading: isMultiLoading } = useQuery({
    queryKey: ['analytics-multi', yearMonths],
    queryFn: () => Promise.all(yearMonths.map((ym) => apiClient<MonthlyReport>(`/reports/monthly/${ym}`))),
    enabled: viewMode !== '이번 달',
  });

  const isLoading = isSingleLoading || isMultiLoading;

  const barData = (() => {
    if (viewMode === '이번 달') {
      if (amountType === '전체') {
        return [
          {
            value: singleReport?.totalExpense ?? 0,
            label: '지출',
            frontColor: colors.loss.text,
            spacing: 8,
          },
          {
            value: singleReport?.totalIncome ?? 0,
            label: '수입',
            frontColor: colors.profit.text,
            spacing: 0,
          },
        ];
      }
      return (singleReport?.dailyExpenses?.map((d, i) => ({
        value: amountType === '지출' ? d.amount : 0,
        label: d.date.slice(8),
        frontColor: amountType === '지출' ? colors.loss.text : colors.profit.text,
        spacing: 0,
      })) ?? []);
    }
    if (amountType === '전체') {
      return (multiReports?.flatMap((r) => {
        const [, m] = r.yearMonth.split('-');
        return [
          {
            value: r.totalExpense,
            label: `${Number(m)}월`,
            frontColor: colors.loss.text,
            spacing: 4,
          },
          {
            value: r.totalIncome,
            label: '',
            frontColor: colors.profit.text,
            spacing: 20,
          },
        ];
      }) ?? []);
    }
    return (multiReports?.map((r) => {
      const [, m] = r.yearMonth.split('-');
      return {
        value: amountType === '지출' ? r.totalExpense : r.totalIncome,
        label: `${Number(m)}월`,
        frontColor: amountType === '지출' ? colors.loss.text : colors.profit.text,
        spacing: 0,
      };
    }) ?? []);
  })();

  const report = singleReport;
  const currency: CurrencyCode = report?.currency ?? 'KRW';

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{
        flexDirection: 'row', gap: 8,
        paddingHorizontal: spacing.screenPadding,
        marginBottom: 16,
      }}>
        {(['이번 달', '3개월', '6개월'] as ViewMode[]).map((mode) => {
          const active = viewMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              onPress={() => setViewMode(mode)}
              style={{
                paddingHorizontal: 14, paddingVertical: 7,
                borderRadius: radius.chip,
                backgroundColor: active ? colors.text.brand : colors.bg.surface,
                borderWidth: 1,
                borderColor: active ? colors.text.brand : colors.system.border,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: active ? colors.text.inverse : colors.text.secondary }}>
                {mode}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {viewMode === '이번 달' && (
        <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: 16 }}>
          <MonthPicker yearMonth={baseYearMonth} onChange={onChangeYearMonth} />
        </View>
      )}

      <View style={{
        flexDirection: 'row', gap: 8,
        paddingHorizontal: spacing.screenPadding,
        marginBottom: spacing.sectionGap,
      }}>
        {(['전체', '지출', '수입'] as AmountType[]).map((t) => {
          const active = amountType === t;
          const activeColor = t === '지출' ? colors.loss.text : t === '수입' ? colors.profit.text : colors.text.brand;
          const activeBg = t === '지출' ? colors.loss.light : t === '수입' ? colors.profit.light : colors.bg.surface;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setAmountType(t)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6,
                borderRadius: radius.chip,
                backgroundColor: active ? activeBg : colors.bg.surface,
                borderWidth: 1,
                borderColor: active ? activeColor : colors.system.border,
              }}
            >
              <Text style={{
                fontSize: 13,
                fontFamily: active ? 'Pretendard-SemiBold' : 'Pretendard-Regular',
                color: active ? activeColor : colors.text.secondary,
              }}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {viewMode === '이번 달' && (
        <View style={{
          flexDirection: 'row', gap: 12,
          paddingHorizontal: spacing.screenPadding,
          marginBottom: spacing.sectionGap,
        }}>
          <LinearGradient
            colors={[colors.profit.light, colors.profit.light]}
            style={{ flex: 1, borderRadius: radius.card, padding: 16 }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>수입</Text>
            <Text style={{ ...typography.amount.small, color: colors.profit.text }}>
              +{formatCurrency(report?.totalIncome ?? 0, currency)}
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={[colors.loss.light, colors.loss.light]}
            style={{ flex: 1, borderRadius: radius.card, padding: 16 }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>지출</Text>
            <Text style={{ ...typography.amount.small, color: colors.loss.text }}>
              -{formatCurrency(report?.totalExpense ?? 0, currency)}
            </Text>
          </LinearGradient>
        </View>
      )}

      {isLoading ? (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : barData.length > 0 ? (
        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          ...shadow.card,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 }}>
            <Text style={{ ...typography.heading.h3, color: colors.text.primary, flex: 1 }}>
              {viewMode === '이번 달' && amountType === '전체' ? '이번 달 수입 vs 지출'
                : viewMode === '이번 달' ? `일별 ${amountType}`
                : `${viewMode} ${amountType} 추이`}
            </Text>
            {amountType === '전체' && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.loss.text }} />
                  <Text style={{ fontSize: 11, color: colors.text.tertiary }}>지출</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.profit.text }} />
                  <Text style={{ fontSize: 11, color: colors.text.tertiary }}>수입</Text>
                </View>
              </View>
            )}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart
              data={barData}
              barWidth={viewMode === '이번 달' && amountType !== '전체' ? 18 : viewMode === '이번 달' ? 60 : amountType === '전체' ? 30 : 40}
              spacing={viewMode === '이번 달' && amountType !== '전체' ? 8 : 12}
              hideRules
              xAxisThickness={0}
              yAxisThickness={0}
              yAxisTextStyle={{ color: colors.text.tertiary, fontSize: 10 }}
              xAxisLabelTextStyle={{ color: colors.text.tertiary, fontSize: 9 }}
              noOfSections={3}
              maxValue={barData.length > 0 ? Math.max(...barData.map((d) => d.value), 1) * 1.2 : 100}
              isAnimated
            />
          </ScrollView>
        </View>
      ) : (
        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          padding: 32, alignItems: 'center', gap: 12,
        }}>
          <BarChart3 size={36} color={colors.text.tertiary} strokeWidth={1.6} />
          <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
            해당 기간 거래 내역이 없어요.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

function CategoryTab({
  yearMonth,
  onChangeYearMonth,
}: {
  yearMonth: string;
  onChangeYearMonth: (ym: string) => void;
}) {
  const [drilldownCategory, setDrilldownCategory] = useState<CategoryExpense | null>(null);
  const [drilldownVisible, setDrilldownVisible] = useState(false);
  const [categoryType, setCategoryType] = useState<CategoryType>('지출');

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', yearMonth],
    queryFn: () => apiClient<MonthlyReport>(`/reports/monthly/${yearMonth}`),
  });

  const categories = categoryType === '지출'
    ? (report?.categoryExpenses ?? [])
    : (report?.categoryIncomes ?? []);

  const totalAmount = categoryType === '지출'
    ? (report?.totalExpense ?? 0)
    : (report?.totalIncome ?? 0);

  const pieData = categories.map((c, i) => ({
    value: c.amount,
    color: CHART_COLORS[i % CHART_COLORS.length],
    text: `${c.percentage.toFixed(0)}%`,
    label: c.categoryName,
  }));

  const currency: CurrencyCode = report?.currency ?? 'KRW';

  function openDrilldown(cat: CategoryExpense) {
    setDrilldownCategory(cat);
    setDrilldownVisible(true);
  }

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: spacing.sectionGap }}>
          <MonthPicker yearMonth={yearMonth} onChange={onChangeYearMonth} />
        </View>

        <View style={{
          flexDirection: 'row', gap: 8,
          paddingHorizontal: spacing.screenPadding,
          marginBottom: spacing.sectionGap,
        }}>
          {(['지출', '수입'] as CategoryType[]).map((t) => {
            const active = categoryType === t;
            const activeColor = t === '지출' ? colors.loss.text : colors.profit.text;
            const activeBg = t === '지출' ? colors.loss.light : colors.profit.light;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setCategoryType(t)}
                style={{
                  paddingHorizontal: 18, paddingVertical: 7,
                  borderRadius: radius.chip,
                  backgroundColor: active ? activeBg : colors.bg.surface,
                  borderWidth: 1,
                  borderColor: active ? activeColor : colors.system.border,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: active ? activeColor : colors.text.secondary }}>
                  {t}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <ActivityIndicator color={colors.text.brand} />
          </View>
        ) : pieData.length > 0 ? (
          <>
            <View style={{
              marginHorizontal: spacing.screenPadding,
              backgroundColor: colors.bg.surface,
              borderRadius: radius.card,
              padding: spacing.cardPadding,
              marginBottom: spacing.sectionGap,
              ...shadow.card,
            }}>
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary, marginBottom: 16 }}>
                카테고리별 {categoryType}
              </Text>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <PieChart
                  data={pieData}
                  donut
                  radius={90}
                  innerRadius={55}
                  centerLabelComponent={() => (
                    <View style={{ alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, color: colors.text.tertiary }}>총 {categoryType}</Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Pretendard-Bold', color: colors.text.primary }}>
                        {CURRENCY_SYMBOLS[currency]}{totalAmount.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  isAnimated
                />
              </View>
            </View>

            <View style={{
              marginHorizontal: spacing.screenPadding,
              backgroundColor: colors.bg.surface,
              borderRadius: radius.card,
              padding: spacing.cardPadding,
              ...shadow.card,
            }}>
              <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.secondary, marginBottom: 12 }}>
                카테고리 상세 (탭하면 거래 목록)
              </Text>
              <View style={{ gap: 0 }}>
                {categories.map((cat, i) => (
                  <TouchableOpacity
                    key={cat.categoryName}
                    onPress={() => openDrilldown(cat)}
                    activeOpacity={0.7}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 10,
                      paddingVertical: 12,
                      borderBottomWidth: i < (categories.length - 1) ? 1 : 0,
                      borderBottomColor: colors.system.divider,
                    }}
                  >
                    <View style={{
                      width: 12, height: 12, borderRadius: 6,
                      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                    }} />
                    <Text style={{ fontSize: 14, color: colors.text.primary, flex: 1 }}>
                      {cat.categoryEmoji} {cat.categoryName}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                      {cat.percentage.toFixed(1)}%
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.primary, minWidth: 80, textAlign: 'right' }}>
                      {formatCurrency(cat.amount, currency)}
                    </Text>
                    <ChevronRight size={16} color={colors.text.tertiary} strokeWidth={2} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : (
          <View style={{
            marginHorizontal: spacing.screenPadding,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: 32, alignItems: 'center', gap: 12,
          }}>
            <BarChart3 size={36} color={colors.text.tertiary} strokeWidth={1.6} />
            <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              해당 월 {categoryType} 내역이 없어요.{'\n'}GLLO와 함께 가계부를 작성해볼까요?
            </Text>
          </View>
        )}
      </ScrollView>

      <CategoryDrilldownSheet
        visible={drilldownVisible}
        category={drilldownCategory}
        yearMonth={yearMonth}
        currency={currency}
        onClose={() => setDrilldownVisible(false)}
      />
    </>
  );
}

export default function AnalyticsScreen() {
  const [tab, setTab] = useState<AnalyticsTab>('추이');
  const [trendYearMonth, setTrendYearMonth] = useState(getYearMonth());
  const [categoryYearMonth, setCategoryYearMonth] = useState(getYearMonth());

  const TABS: AnalyticsTab[] = ['추이', '카테고리별'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ ...typography.heading.h2, color: colors.text.primary, marginBottom: 4 }}>
          수입/지출 분석
        </Text>
        <Text style={{ ...typography.caption, color: colors.text.tertiary }}>
          GLLO가 이번 달 수입/지출 흐름을 살펴봤어요.
        </Text>
      </View>

      <View style={{
        flexDirection: 'row',
        marginHorizontal: spacing.screenPadding,
        marginBottom: 16,
        backgroundColor: colors.bg.surface,
        borderRadius: radius.chip,
        padding: 3,
      }}>
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1, paddingVertical: 8, alignItems: 'center',
                borderRadius: radius.chip - 2,
                backgroundColor: active ? colors.text.brand : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 14, fontFamily: 'Pretendard-SemiBold',
                color: active ? colors.text.inverse : colors.text.secondary,
              }}>
                {t}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {tab === '추이' ? (
        <TrendTab
          baseYearMonth={trendYearMonth}
          onChangeYearMonth={setTrendYearMonth}
        />
      ) : (
        <CategoryTab
          yearMonth={categoryYearMonth}
          onChangeYearMonth={setCategoryYearMonth}
        />
      )}
    </SafeAreaView>
  );
}
