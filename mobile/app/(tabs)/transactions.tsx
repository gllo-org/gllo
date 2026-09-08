import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/currency';
import { formatDate } from '@/lib/utils/date';
import { colors, spacing, radius, typography } from '@/theme';
import { TransactionSheet } from '@/components/features/TransactionSheet';
import type { CurrencyCode } from '@/theme';

type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'EXCHANGE';

interface Transaction {
  id: string;
  title: string;
  type: TransactionType;
  amount: number;
  currency: CurrencyCode;
  categoryName: string;
  categoryEmoji: string;
  transactionDate: string;
  isTrip: boolean;
}

interface TransactionPage {
  content: Transaction[];
  hasNext: boolean;
  page: number;
}

interface ExchangeRate {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
}

const TYPE_LABELS: Record<TransactionType, string> = {
  INCOME:   '수입',
  EXPENSE:  '지출',
  TRANSFER: '이체',
  EXCHANGE: '환전기록',
};

function buildKrwRateMap(rates: ExchangeRate[]): Record<string, number> {
  const map: Record<string, number> = { KRW: 1 };
  for (const r of rates) {
    if (r.targetCurrency === 'KRW') {
      map[r.baseCurrency] = r.rate;
    } else if (r.baseCurrency === 'KRW' && r.rate > 0 && !map[r.targetCurrency]) {
      map[r.targetCurrency] = 1 / r.rate;
    }
  }
  return map;
}

function TransactionItem({ item, krwRate }: { item: Transaction; krwRate: number | null }) {
  const router = useRouter();
  const isPositive = item.type === 'INCOME';
  const isExchange = item.type === 'EXCHANGE';
  const amountColor = isPositive ? colors.profit.text : isExchange ? colors.text.brand : colors.loss.text;
  const prefix = isPositive ? '+' : isExchange ? '↕' : '-';
  const showKrw = krwRate !== null && item.currency !== 'KRW' && item.type !== 'EXCHANGE';

  return (
    <TouchableOpacity
      onPress={() => router.push(`/transaction/${item.id}`)}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: spacing.screenPadding,
        borderBottomWidth: 1,
        borderBottomColor: colors.system.divider,
      }}>
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: colors.bg.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
      }}>
        <Text style={{ fontSize: 22 }}>{item.categoryEmoji || '💸'}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: colors.text.primary }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 2 }}>
          {item.categoryName} · {formatDate(item.transactionDate)}
          {item.isTrip && ' ✈️'}
        </Text>
      </View>

      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ ...typography.amount.small, color: amountColor, fontWeight: '600' }}>
          {prefix}{formatCurrency(item.amount, item.currency)}
        </Text>
        {showKrw && (
          <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 2 }}>
            ≈ {formatCurrency(item.amount * krwRate!, 'KRW')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function TransactionsScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const { accountId } = useLocalSearchParams<{ accountId?: string }>();

  const { data: exchangeRates = [] } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => apiClient<ExchangeRate[]>('/exchange-rates'),
    staleTime: 1000 * 60 * 10,
  });
  const krwRateMap = buildKrwRateMap(exchangeRates);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['transactions', accountId ?? null],
    queryFn: ({ pageParam = 0 }) =>
      apiClient<TransactionPage>(
        `/transactions?page=${pageParam}&size=20${accountId ? `&accountId=${accountId}` : ''}`
      ),
    getNextPageParam: (last) => last.hasNext ? last.page + 1 : undefined,
    initialPageParam: 0,
  });

  const allTransactions = data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.system.border,
      }}>
        <Text style={{ flex: 1, ...typography.heading.h2, color: colors.text.primary }}>
          거래 내역
        </Text>
        <TouchableOpacity
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingHorizontal: 14, paddingVertical: 7,
              borderRadius: radius.chip,
              flexDirection: 'row', alignItems: 'center', gap: 4,
            }}
          >
            <Text style={{ fontSize: 14, color: colors.text.inverse, fontWeight: '600' }}>+ 추가</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : allTransactions.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 40 }}>💜</Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22 }}>
            아직 거래 내역이 없어요.{'\n'}+ 버튼으로 첫 거래를 기록해볼까요?
          </Text>
        </View>
      ) : (
        <FlatList
          data={allTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TransactionItem item={item} krwRate={krwRateMap[item.currency] ?? null} />
          )}
          ListFooterComponent={
            hasNextPage ? (
              <TouchableOpacity
                onPress={() => { if (!isFetchingNextPage) fetchNextPage(); }}
                disabled={isFetchingNextPage}
                style={{
                  alignItems: 'center',
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderTopColor: colors.system.divider,
                  marginTop: 4,
                }}
              >
                {isFetchingNextPage ? (
                  <ActivityIndicator color={colors.text.brand} />
                ) : (
                  <Text style={{ fontSize: 14, color: colors.text.brand, fontFamily: 'Pretendard-Medium' }}>
                    이전 거래 더 보기
                  </Text>
                )}
              </TouchableOpacity>
            ) : allTransactions.length > 0 ? (
              <Text style={{
                textAlign: 'center',
                fontSize: 12,
                color: colors.text.tertiary,
                fontFamily: 'Pretendard-Regular',
                paddingVertical: 16,
              }}>
                모든 거래를 불러왔어요
              </Text>
            ) : null
          }
        />
      )}

      <TransactionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
