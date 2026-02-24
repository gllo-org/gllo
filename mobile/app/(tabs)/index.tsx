import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import { TransactionSheet } from '@/components/features/TransactionSheet';
import type { CurrencyCode } from '@/theme';

interface DashboardStats {
  totalAssetKrw: number;
  monthlyIncome: number;
  monthlyExpense: number;
  budgetAmount: number | null;
  budgetSpent: number;
  budgetSpentRate: number;
  timeProgressRate: number;
  dailyRecommended: number | null;
  currency: CurrencyCode;
}

interface Account {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number | null;
  unrealizedPnl: number | null;
  pnlRate: number | null;
}

function SkeletonBox({ width, height }: { width: DimensionValue; height: number }) {
  return (
    <View style={{
      width, height,
      backgroundColor: colors.system.skeleton,
      borderRadius: 8,
    }} />
  );
}

function BudgetStatusText(spentRate: number, timeRate: number): string {
  if (spentRate > timeRate + 5) return '글로가 보기엔 이번 달 지출 페이스가 조금 빠른 편이에요.';
  if (spentRate < timeRate - 5) return '글로가 보기엔 이번 달 지출 페이스가 좋아요.';
  return '글로가 이번 달 지출 흐름을 살펴봤어요.';
}

function getBudgetBarColor(spentRate: number, timeRate: number): string {
  if (spentRate > timeRate + 5) return colors.status.danger;
  if (spentRate > timeRate) return colors.status.warning;
  return colors.status.normal;
}

export default function DashboardScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const router = useRouter();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardStats>('/dashboard/statistics'),
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        <LinearGradient
          colors={colors.gradient.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20, paddingBottom: 28 }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary }}>글로</Text>
            <TouchableOpacity style={{
              backgroundColor: 'rgba(255,255,255,0.7)',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
            }}>
              <Text style={{ fontSize: 13, color: colors.text.brand, fontWeight: '600' }}>
                + 환전 기록
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 4 }}>
            총 자산 (KRW 환산)
          </Text>
          {statsLoading ? (
            <SkeletonBox width={200} height={44} />
          ) : (
            <Text style={{ ...typography.amount.hero, color: colors.text.primary }}>
              {formatCurrency(stats?.totalAssetKrw ?? 0, 'KRW')}
            </Text>
          )}
        </LinearGradient>

        <View style={{ paddingHorizontal: spacing.screenPadding, marginTop: spacing.sectionGap }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>
            내 계좌
          </Text>

          {accountsLoading ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <SkeletonBox width={160} height={120} />
              <SkeletonBox width={160} height={120} />
            </View>
          ) : accounts && accounts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.screenPadding }}>
              <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: spacing.screenPadding }}>
                {accounts.map((account) => {
                  const currencyColor = colors.currency[account.currency];
                  const isPositive = (account.pnlRate ?? 0) >= 0;
                  return (
                    <View key={account.id} style={{
                      backgroundColor: currencyColor.bg,
                      borderRadius: radius.card,
                      padding: spacing.cardPadding,
                      minWidth: 160,
                      ...shadow.card,
                    }}>
                      <Text style={{ fontSize: 20, marginBottom: 4 }}>
                        {CURRENCY_FLAGS[account.currency]}
                      </Text>
                      <Text style={{ fontSize: 12, color: currencyColor.text, fontWeight: '500', marginBottom: 8 }}>
                        {account.name}
                      </Text>
                      <Text style={{ ...typography.amount.medium, color: colors.text.primary }}>
                        {formatCurrency(account.balance, account.currency)}
                      </Text>
                      {account.averageRate !== null && (
                        <Text style={{ fontSize: 11, color: colors.text.secondary, marginTop: 4 }}>
                          평단가 {formatCurrency(account.averageRate, 'KRW')}/{account.currency}
                        </Text>
                      )}
                      {account.pnlRate !== null && (
                        <Text style={{
                          fontSize: 12,
                          fontWeight: '600',
                          color: isPositive ? colors.profit.text : colors.loss.text,
                          marginTop: 4,
                        }}>
                          {isPositive ? '▲' : '▼'} {Math.abs(account.pnlRate).toFixed(2)}%
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/accounts')}
              activeOpacity={0.85}
            >
              <View style={{
                backgroundColor: colors.bg.surface,
                borderRadius: radius.card,
                padding: spacing.cardPadding,
                alignItems: 'center',
                borderWidth: 1.5,
                borderColor: colors.system.border,
                borderStyle: 'dashed',
              }}>
                <Text style={{ fontSize: 24, marginBottom: 8 }}>🏦</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.brand }}>
                  + 계좌 추가하기
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 4 }}>
                  글로와 함께 첫 계좌를 만들어볼까요?
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {stats?.budgetAmount && (
          <View style={{
            marginHorizontal: spacing.screenPadding,
            marginTop: spacing.sectionGap,
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            ...shadow.card,
          }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>
              {BudgetStatusText(stats.budgetSpentRate, stats.timeProgressRate)}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 16 }}>
              이번 달 예산
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ ...typography.amount.medium, color: colors.text.primary }}>
                {formatCurrency(stats.budgetSpent, stats.currency)}
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.secondary }}>
                / {formatCurrency(stats.budgetAmount, stats.currency)}
              </Text>
            </View>

            <View style={{
              height: 10,
              backgroundColor: colors.system.border,
              borderRadius: 5,
              overflow: 'hidden',
              marginBottom: 8,
            }}>
              <LinearGradient
                colors={colors.gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: '100%',
                  width: `${Math.min(stats.budgetSpentRate, 100)}%`,
                  borderRadius: 5,
                }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                예산 소진 {stats.budgetSpentRate.toFixed(1)}%
              </Text>
              <Text style={{ fontSize: 11, color: colors.text.tertiary }}>
                시간 경과 {stats.timeProgressRate.toFixed(1)}%
              </Text>
            </View>

            {stats.dailyRecommended !== null && (
              <View style={{
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: colors.system.divider,
              }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                  하루 권장 지출
                </Text>
                <Text style={{ ...typography.amount.small, color: colors.text.brand, marginTop: 2 }}>
                  {formatCurrency(stats.dailyRecommended, stats.currency)} / 일
                </Text>
              </View>
            )}
          </View>
        )}

        <View style={{ paddingHorizontal: spacing.screenPadding, marginTop: spacing.sectionGap }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>
              이번 달
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{
              flex: 1,
              backgroundColor: colors.profit.light,
              borderRadius: radius.card,
              padding: 16,
            }}>
              <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 4 }}>수입</Text>
              {statsLoading
                ? <SkeletonBox width="100%" height={24} />
                : <Text style={{ ...typography.amount.small, color: colors.profit.text, fontWeight: '700' }}>
                    +{formatCurrency(stats?.monthlyIncome ?? 0, stats?.currency ?? 'KRW')}
                  </Text>
              }
            </View>
            <View style={{
              flex: 1,
              backgroundColor: colors.loss.light,
              borderRadius: radius.card,
              padding: 16,
            }}>
              <Text style={{ fontSize: 12, color: colors.text.secondary, marginBottom: 4 }}>지출</Text>
              {statsLoading
                ? <SkeletonBox width="100%" height={24} />
                : <Text style={{ ...typography.amount.small, color: colors.loss.text, fontWeight: '700' }}>
                    -{formatCurrency(stats?.monthlyExpense ?? 0, stats?.currency ?? 'KRW')}
                  </Text>
              }
            </View>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        onPress={() => setSheetVisible(true)}
        style={{
          position: 'absolute',
          bottom: 80,
          alignSelf: 'center',
          ...shadow.float,
        }}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={colors.gradient.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 28, color: colors.text.inverse, lineHeight: 32 }}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TransactionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
