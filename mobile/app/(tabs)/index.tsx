import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, DimensionValue, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export default function DashboardScreen() {
  const [sheetVisible, setSheetVisible] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiClient<DashboardStats>('/dashboard/home'),
  });

  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => apiClient<Account[]>('/accounts'),
  });

  const { mutateAsync: deleteAccount } = useMutation({
    mutationFn: (id: string) => apiClient(`/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  function handleAccountActions(account: Account) {
    Alert.alert(account.name, undefined, [
      {
        text: '거래 내역 보기',
        onPress: () => router.push('/(tabs)/transactions'),
      },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          Alert.alert('계좌 삭제', `"${account.name}"을(를) 삭제할까요?\n관련 거래 내역도 함께 삭제돼요.`, [
            { text: '취소', style: 'cancel' },
            {
              text: '삭제', style: 'destructive',
              onPress: async () => {
                try {
                  await deleteAccount(account.id);
                  Alert.alert('완료', '계좌가 삭제되었습니다.');
                } catch {
                  Alert.alert('오류', '삭제에 실패했어요.');
                }
              },
            },
          ]);
        },
      },
      { text: '취소', style: 'cancel' },
    ]);
  }

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
            <Text style={{ ...typography.heading.h2, color: colors.text.primary }}>글로</Text>
          </View>

          <Text style={{ ...typography.body.small, color: colors.text.secondary, marginBottom: 4 }}>
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
          <Text style={{ ...typography.heading.h3, color: colors.text.primary, marginBottom: 12 }}>
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
                    <TouchableOpacity
                      key={account.id}
                      onPress={() => handleAccountActions(account)}
                      activeOpacity={0.85}
                    >
                      <View style={{
                        backgroundColor: currencyColor.bg,
                        borderRadius: radius.card,
                        padding: spacing.cardPadding,
                        minWidth: 160,
                        ...shadow.card,
                      }}>
                        <Text style={{ fontSize: 20, marginBottom: 4 }}>
                          {CURRENCY_FLAGS[account.currency]}
                        </Text>
                        <Text style={{ ...typography.label, color: currencyColor.text, marginBottom: 8 }}>
                          {account.name}
                        </Text>
                        <Text style={{ ...typography.amount.medium, color: colors.text.primary }}>
                          {formatCurrency(account.balance, account.currency)}
                        </Text>
                        {!!account.averageRate && (
                          <Text style={{ ...typography.caption, color: colors.text.secondary, marginTop: 4 }}>
                            평단가 {formatCurrency(account.averageRate, 'KRW')}/{account.currency}
                          </Text>
                        )}
                        {account.pnlRate != null && (
                          <Text style={{
                            ...typography.caption,
                            fontFamily: 'Pretendard-SemiBold',
                            color: isPositive ? colors.profit.text : colors.loss.text,
                            marginTop: 4,
                          }}>
                            {isPositive ? '▲' : '▼'} {Math.abs(account.pnlRate).toFixed(2)}%
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity
                  onPress={() => router.push('/accounts')}
                  activeOpacity={0.85}
                >
                  <View style={{
                    backgroundColor: colors.bg.surface,
                    borderRadius: radius.card,
                    padding: spacing.cardPadding,
                    minWidth: 120,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1.5,
                    borderColor: colors.system.border,
                    borderStyle: 'dashed',
                    ...shadow.card,
                  }}>
                    <Text style={{ fontSize: 22, marginBottom: 6 }}>+</Text>
                    <Text style={{ fontSize: 12, color: colors.text.brand, fontWeight: '600' }}>계좌 추가</Text>
                  </View>
                </TouchableOpacity>
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
                <Text style={{ ...typography.body.medium, fontFamily: 'Pretendard-SemiBold', color: colors.text.brand }}>
                  + 계좌 추가하기
                </Text>
                <Text style={{ ...typography.caption, color: colors.text.tertiary, marginTop: 4 }}>
                  글로와 함께 첫 계좌를 만들어볼까요?
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {stats?.budgetAmount && (
          <TouchableOpacity
            onPress={() => router.push('/budget')}
            activeOpacity={0.92}
            style={{
              marginHorizontal: spacing.screenPadding,
              marginTop: spacing.sectionGap,
            }}
          >
          <View style={{
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            ...shadow.card,
          }}>
            <Text style={{ ...typography.caption, color: colors.text.tertiary, marginBottom: 4 }}>
              {BudgetStatusText(stats.budgetSpentRate, stats.timeProgressRate)}
            </Text>
            <Text style={{ ...typography.heading.h3, color: colors.text.primary, marginBottom: 16 }}>
              이번 달 예산
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text style={{ ...typography.amount.medium, color: colors.text.primary }}>
                {formatCurrency(stats.budgetSpent, stats.currency)}
              </Text>
              <Text style={{ ...typography.body.small, color: colors.text.secondary }}>
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
              <Text style={{ ...typography.caption, color: colors.text.secondary }}>
                예산 소진 {stats.budgetSpentRate.toFixed(1)}%
              </Text>
              <Text style={{ ...typography.caption, color: colors.text.tertiary }}>
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
                <Text style={{ ...typography.caption, color: colors.text.tertiary }}>
                  하루 권장 지출
                </Text>
                <Text style={{ ...typography.amount.small, color: colors.text.brand, marginTop: 2 }}>
                  {formatCurrency(stats.dailyRecommended, stats.currency)} / 일
                </Text>
              </View>
            )}
          </View>
          </TouchableOpacity>
        )}

        <View style={{ paddingHorizontal: spacing.screenPadding, marginTop: spacing.sectionGap }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ ...typography.heading.h3, color: colors.text.primary }}>
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
              <Text style={{ ...typography.caption, color: colors.text.secondary, marginBottom: 4 }}>수입</Text>
              {statsLoading
                ? <SkeletonBox width="100%" height={24} />
                : <Text style={{ ...typography.amount.small, fontFamily: 'Pretendard-Bold', color: colors.profit.text }}>
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
              <Text style={{ ...typography.caption, color: colors.text.secondary, marginBottom: 4 }}>지출</Text>
              {statsLoading
                ? <SkeletonBox width="100%" height={24} />
                : <Text style={{ ...typography.amount.small, fontFamily: 'Pretendard-Bold', color: colors.loss.text }}>
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
          bottom: 88,
          alignSelf: 'center',
          width: 56,
          height: 56,
          borderRadius: 28,
          overflow: 'hidden',
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
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{
            fontSize: 28,
            color: colors.text.inverse,
            lineHeight: 32,
            textAlign: 'center',
            includeFontPadding: false,
          }}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TransactionSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
      />
    </SafeAreaView>
  );
}
