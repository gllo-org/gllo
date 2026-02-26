import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { apiClient, ApiError } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow } from '@/theme';
import type { CurrencyCode } from '@/theme';

interface UnrealizedPnlItem {
  accountId: number;
  accountName: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number;
  currentRate: number;
  unrealizedPnl: number;
  unrealizedPnlPercentage: number;
}

const BASE_CURRENCIES: CurrencyCode[] = ['KRW', 'EUR', 'USD'];

function PnlBadge({ pnl, percentage }: { pnl: number; percentage: number }) {
  if (pnl === 0) {
    return (
      <View style={{
        paddingHorizontal: 8, paddingVertical: 4,
        borderRadius: radius.chip,
        backgroundColor: colors.neutral.bg,
      }}>
        <Text style={{ fontSize: 12, fontWeight: '600', color: colors.neutral.text }}>± 0%</Text>
      </View>
    );
  }

  const isProfit = pnl > 0;
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 4,
      borderRadius: radius.chip,
      backgroundColor: isProfit ? colors.profit.bg : colors.loss.bg,
    }}>
      <Text style={{
        fontSize: 12, fontWeight: '600',
        color: isProfit ? colors.profit.text : colors.loss.text,
      }}>
        {isProfit ? '▲' : '▼'} {Math.abs(percentage).toFixed(2)}%
      </Text>
    </View>
  );
}

function RateRow({ label, value, baseCurrency }: { label: string; value: number; baseCurrency: CurrencyCode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ fontSize: 12, color: colors.text.tertiary }}>{label}</Text>
      <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text.secondary }}>
        {baseCurrency === 'KRW'
          ? `${value.toLocaleString('ko-KR', { maximumFractionDigits: 0 })} KRW`
          : `${value.toFixed(4)} ${baseCurrency}`}
      </Text>
    </View>
  );
}

function AccountPnlCard({ item, baseCurrency }: { item: UnrealizedPnlItem; baseCurrency: CurrencyCode }) {
  const cc = colors.currency[item.currency];
  const isProfit = item.unrealizedPnl > 0;
  const isNeutral = item.unrealizedPnl === 0;

  return (
    <View style={{
      backgroundColor: colors.bg.surface,
      borderRadius: radius.card,
      padding: 16,
      marginBottom: 12,
      ...shadow.card,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: cc.bg, alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>{CURRENCY_FLAGS[item.currency]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary }}>
            {item.accountName}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 1 }}>
            {formatCurrency(item.balance, item.currency)}
          </Text>
        </View>
        <PnlBadge pnl={item.unrealizedPnl} percentage={item.unrealizedPnlPercentage} />
      </View>

      <View style={{ height: 1, backgroundColor: colors.system.divider, marginBottom: 10 }} />

      <View style={{ gap: 6 }}>
        <RateRow label="평균 매입 환율" value={item.averageRate} baseCurrency={baseCurrency} />
        <RateRow label="현재 환율" value={item.currentRate} baseCurrency={baseCurrency} />
      </View>

      <View style={{
        marginTop: 12,
        padding: 12,
        borderRadius: radius.input,
        backgroundColor: isNeutral
          ? colors.neutral.bg
          : isProfit ? colors.profit.light : colors.loss.light,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <Text style={{ fontSize: 13, color: colors.text.secondary }}>평가손익</Text>
        <Text style={{
          fontSize: 15, fontWeight: '700',
          color: isNeutral ? colors.neutral.text : isProfit ? colors.profit.text : colors.loss.text,
        }}>
          {isProfit ? '+' : ''}{formatCurrency(item.unrealizedPnl, baseCurrency)}
        </Text>
      </View>
    </View>
  );
}

export default function UnrealizedPnlScreen() {
  const router = useRouter();
  const [baseCurrency, setBaseCurrency] = useState<CurrencyCode>('KRW');

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ['unrealized-pnl', baseCurrency],
    queryFn: () => apiClient<UnrealizedPnlItem[]>(`/unrealized-pnl?baseCurrency=${baseCurrency}`),
  });

  const foreignItems = items.filter((item) => item.currency !== baseCurrency);
  const totalPnl = foreignItems.reduce((sum, item) => sum + item.unrealizedPnl, 0);
  const isTotalProfit = totalPnl > 0;
  const isTotalNeutral = totalPnl === 0;

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
          미실현 손익
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
          {BASE_CURRENCIES.map((c) => {
            const active = baseCurrency === c;
            return (
              <TouchableOpacity
                key={c}
                onPress={() => setBaseCurrency(c)}
                style={{
                  flex: 1, paddingVertical: 9, borderRadius: radius.chip,
                  backgroundColor: active ? colors.currency[c].bg : 'transparent',
                  alignItems: 'center', borderWidth: 1.5,
                  borderColor: active ? colors.currency[c].primary : colors.system.border,
                }}
              >
                <Text style={{
                  fontSize: 12, fontWeight: '700',
                  color: active ? colors.currency[c].text : colors.text.tertiary,
                }}>
                  {c}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isLoading ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <ActivityIndicator color={colors.text.brand} />
          </View>
        ) : error instanceof ApiError && error.code === 404 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.secondary }}>
              외화 계좌가 없어요
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.tertiary, textAlign: 'center' }}>
              계좌를 추가하고 환전하면{'\n'}평가손익을 확인할 수 있어요.
            </Text>
          </View>
        ) : foreignItems.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
            <Text style={{ fontSize: 40 }}>📊</Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.secondary }}>
              외화 계좌가 없어요
            </Text>
            <Text style={{ fontSize: 13, color: colors.text.tertiary, textAlign: 'center' }}>
              계좌를 추가하고 환전하면{'\n'}평가손익을 확인할 수 있어요.
            </Text>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={
                isTotalNeutral
                  ? [colors.neutral.bg, colors.neutral.bg, colors.neutral.bg]
                  : isTotalProfit
                  ? [colors.profit.light, colors.profit.bg, colors.profit.light]
                  : [colors.loss.light, colors.loss.bg, colors.loss.light]
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: radius.card, padding: 20, marginBottom: 20,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6 }}>
                전체 평가손익 ({baseCurrency} 기준)
              </Text>
              <Text style={{
                fontSize: 28, fontWeight: '700',
                color: isTotalNeutral ? colors.neutral.text : isTotalProfit ? colors.profit.text : colors.loss.text,
              }}>
                {isTotalProfit ? '+' : ''}{formatCurrency(totalPnl, baseCurrency)}
              </Text>
            </LinearGradient>

            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 12 }}>
              계좌별 상세
            </Text>

            {foreignItems.map((item) => (
              <AccountPnlCard key={item.accountId} item={item} baseCurrency={baseCurrency} />
            ))}

            <View style={{
              marginTop: 8, padding: 14,
              backgroundColor: colors.bg.surface,
              borderRadius: radius.card,
            }}>
              <Text style={{ fontSize: 12, color: colors.text.tertiary, textAlign: 'center', lineHeight: 18 }}>
                평가손익은 현재 시장 환율 기준 수치입니다.{'\n'}실제 환전 시 손익과 다를 수 있습니다.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
