import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_SYMBOLS } from '@/lib/utils/currency';
import { getYearMonth } from '@/lib/utils/date';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface MonthlyReport {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  currency: CurrencyCode;
  categoryExpenses: CategoryExpense[];
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

const CHART_COLORS = [
  '#C4B5F8', '#F0A8C8', '#FFBDA0',
  '#86EFAC', '#93C5FD', '#FCD34D',
  '#A5B4FC', '#F9A8D4', '#6EE7B7',
];

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
        <Text style={{ fontSize: 18, color: colors.text.primary }}>‹</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text.primary }}>
        {year}년 {Number(month)}월
      </Text>
      <TouchableOpacity onPress={() => shift(1)} disabled={isFuture} style={{ padding: 8 }}>
        <Text style={{ fontSize: 18, color: isFuture ? colors.text.tertiary : colors.text.primary }}>›</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function AnalyticsScreen() {
  const [yearMonth, setYearMonth] = useState(getYearMonth());

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', yearMonth],
    queryFn: () => apiClient<MonthlyReport>(`/reports/monthly/${yearMonth}`),
  });

  const barData = report?.dailyExpenses.map((d, i) => ({
    value: d.amount,
    label: d.date.slice(8),
    frontColor: i === report.dailyExpenses.length - 1
      ? colors.gradient.primary[1]
      : colors.gradient.primary[0],
  })) ?? [];

  const pieData = report?.categoryExpenses.map((c, i) => ({
    value: c.amount,
    color: CHART_COLORS[i % CHART_COLORS.length],
    text: `${c.percentage.toFixed(0)}%`,
    label: c.categoryName,
  })) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        <View style={{ paddingHorizontal: spacing.screenPadding, paddingVertical: 16 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 4 }}>
            지출 분석
          </Text>
          <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
            글로가 이번 달 지출 흐름을 살펴봤어요.
          </Text>
        </View>

        <View style={{ paddingHorizontal: spacing.screenPadding, marginBottom: spacing.sectionGap }}>
          <MonthPicker yearMonth={yearMonth} onChange={setYearMonth} />
        </View>

        <View style={{
          flexDirection: 'row',
          gap: 12,
          paddingHorizontal: spacing.screenPadding,
          marginBottom: spacing.sectionGap,
        }}>
          <LinearGradient
            colors={[colors.profit.light, colors.profit.light]}
            style={{
              flex: 1,
              borderRadius: radius.card,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>수입</Text>
            <Text style={{ ...typography.amount.small, color: colors.profit.text, fontWeight: '700' }}>
              +{formatCurrency(report?.totalIncome ?? 0, report?.currency ?? 'KRW')}
            </Text>
          </LinearGradient>
          <LinearGradient
            colors={[colors.loss.light, colors.loss.light]}
            style={{
              flex: 1,
              borderRadius: radius.card,
              padding: 16,
            }}
          >
            <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 6 }}>지출</Text>
            <Text style={{ ...typography.amount.small, color: colors.loss.text, fontWeight: '700' }}>
              -{formatCurrency(report?.totalExpense ?? 0, report?.currency ?? 'KRW')}
            </Text>
          </LinearGradient>
        </View>

        {barData.length > 0 && (
          <View style={{
            marginHorizontal: spacing.screenPadding,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            marginBottom: spacing.sectionGap,
            ...shadow.card,
          }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 16 }}>
              일별 지출
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <BarChart
                data={barData}
                barWidth={18}
                spacing={8}
                hideRules
                xAxisThickness={0}
                yAxisThickness={0}
                yAxisTextStyle={{ color: colors.text.tertiary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: colors.text.tertiary, fontSize: 9 }}
                noOfSections={3}
                maxValue={Math.max(...barData.map((d) => d.value)) * 1.2}
                isAnimated
              />
            </ScrollView>
          </View>
        )}

        {pieData.length > 0 && (
          <View style={{
            marginHorizontal: spacing.screenPadding,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            marginBottom: spacing.sectionGap,
            ...shadow.card,
          }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 16 }}>
              카테고리별 지출
            </Text>

            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <PieChart
                data={pieData}
                donut
                radius={90}
                innerRadius={55}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: colors.text.tertiary }}>총 지출</Text>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary }}>
                      {CURRENCY_SYMBOLS[report?.currency ?? 'KRW']}
                      {(report?.totalExpense ?? 0).toLocaleString()}
                    </Text>
                  </View>
                )}
                isAnimated
              />
            </View>

            <View style={{ gap: 10 }}>
              {report?.categoryExpenses.map((cat, i) => (
                <View key={cat.categoryName} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                  }} />
                  <Text style={{ flex: 1, fontSize: 14, color: colors.text.primary }}>
                    {cat.categoryEmoji} {cat.categoryName}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                    {cat.percentage.toFixed(1)}%
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.primary, minWidth: 80, textAlign: 'right' }}>
                    {formatCurrency(cat.amount, report?.currency ?? 'KRW')}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!isLoading && (!report || report.totalExpense === 0) && (
          <View style={{
            marginHorizontal: spacing.screenPadding,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: 32,
            alignItems: 'center',
            gap: 12,
          }}>
            <Text style={{ fontSize: 36 }}>📊</Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
              해당 월 거래 내역이 없어요.{'\n'}글로와 함께 가계부를 작성해볼까요?
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
