import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/currency';
import { colors, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { supabase } from '@/lib/supabase';

const API_BASE = process.env.EXPO_PUBLIC_API_URL;

interface AccountSummary {
  accountId: number;
  accountName: string;
  currency: CurrencyCode;
  balance: number;
  averageRate: number | null;
  currentRate: number | null;
  unrealizedPnl: number | null;
  unrealizedPnlPercent: number | null;
}

interface TransactionSummary {
  categoryName: string;
  totalAmount: number;
  currency: CurrencyCode;
  count: number;
}

interface ReportBudgetSummary {
  currency: CurrencyCode;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  budgetProgressRate: number;
}

interface MonthlyReportData {
  userId: string;
  period: string;
  accounts: AccountSummary[];
  totalAssetsKrw: number;
  transactions: TransactionSummary[];
  budgetSummary: ReportBudgetSummary | null;
}

function toYearMonth(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function formatYearMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return `${y}년 ${parseInt(m, 10)}월`;
}

function prevMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return toYearMonth(d);
}

function nextMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m, 1);
  return toYearMonth(d);
}

function SectionHeader({ title }: { title: string }) {
  return (
    <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.tertiary, marginBottom: 10 }}>
      {title}
    </Text>
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(() => toYearMonth(new Date()));
  const [isDownloading, setIsDownloading] = useState(false);

  const currentYm = toYearMonth(new Date());
  const isCurrentMonth = yearMonth === currentYm;

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', yearMonth],
    queryFn: () => apiClient<MonthlyReportData>(`/reports/monthly/${yearMonth}`),
  });

  async function handleDownloadPdf() {
    setIsDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (Platform.OS === 'web') {
        const res = await fetch(`${API_BASE}/reports/monthly/${yearMonth}/pdf`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('PDF 다운로드 실패');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gllo-report-${yearMonth}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.cacheDirectory}gllo-report-${yearMonth}.pdf`;
        const downloadResult = await FileSystem.downloadAsync(
          `${API_BASE}/reports/monthly/${yearMonth}/pdf`,
          fileUri,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (downloadResult.status !== 200) throw new Error('PDF 다운로드 실패');
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/pdf',
            dialogTitle: `글로 ${formatYearMonth(yearMonth)} 리포트`,
          });
        } else {
          Alert.alert('다운로드 완료', `${fileUri}에 저장되었어요.`);
        }
      }
    } catch {
      Alert.alert('오류', 'PDF 다운로드에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
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
          월간 리포트
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: spacing.screenPadding, paddingBottom: 16, gap: 20,
      }}>
        <TouchableOpacity
          onPress={() => setYearMonth(prevMonth(yearMonth))}
          style={{ padding: 10 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20, color: colors.text.primary }}>‹</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary, minWidth: 120, textAlign: 'center' }}>
          {formatYearMonth(yearMonth)}
        </Text>
        <TouchableOpacity
          onPress={() => !isCurrentMonth && setYearMonth(nextMonth(yearMonth))}
          style={{ padding: 10, opacity: isCurrentMonth ? 0.3 : 1 }}
          disabled={isCurrentMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20, color: colors.text.primary }}>›</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : isError || !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Text style={{ fontSize: 36 }}>📭</Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary }}>
            해당 월의 리포트가 없어요.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}>
          <View style={{
            backgroundColor: colors.bg.surface,
            borderRadius: radius.card,
            padding: spacing.cardPadding,
            marginBottom: 20,
            ...shadow.card,
          }}>
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 6 }}>
              총 자산 (KRW 환산)
            </Text>
            <Text style={{ ...typography.amount.hero, color: colors.text.primary }}>
              {formatCurrency(report.totalAssetsKrw, 'KRW')}
            </Text>
          </View>

          {report.accounts.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionHeader title="계좌별 현황" />
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, overflow: 'hidden', ...shadow.card }}>
                {report.accounts.map((account, idx) => {
                  const isPositive = (account.unrealizedPnl ?? 0) >= 0;
                  return (
                    <View
                      key={account.accountId}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 14,
                        borderBottomWidth: idx < report.accounts.length - 1 ? 1 : 0,
                        borderBottomColor: colors.system.divider,
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                          {account.accountName}
                        </Text>
                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text.primary }}>
                          {formatCurrency(account.balance, account.currency)}
                        </Text>
                      </View>
                      {account.unrealizedPnl !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                            평단가 {account.averageRate != null ? formatCurrency(account.averageRate, 'KRW') : '-'}
                          </Text>
                          <Text style={{
                            fontSize: 12, fontWeight: '600',
                            color: isPositive ? colors.profit.text : colors.loss.text,
                          }}>
                            {isPositive ? '▲' : '▼'} {formatCurrency(Math.abs(account.unrealizedPnl), 'KRW')}
                            {account.unrealizedPnlPercent !== null
                              ? ` (${Math.abs(account.unrealizedPnlPercent).toFixed(2)}%)`
                              : ''}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {report.budgetSummary && (
            <View style={{ marginBottom: 20 }}>
              <SectionHeader title="예산 현황" />
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, padding: 16, ...shadow.card }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                  <View>
                    <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 2 }}>지출</Text>
                    <Text style={{ ...typography.amount.small, color: colors.loss.text }}>
                      {formatCurrency(report.budgetSummary.spentAmount, report.budgetSummary.currency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 2 }}>예산</Text>
                    <Text style={{ ...typography.amount.small, color: colors.text.secondary }}>
                      {formatCurrency(report.budgetSummary.budgetAmount, report.budgetSummary.currency)}
                    </Text>
                  </View>
                </View>
                <View style={{ height: 8, backgroundColor: colors.system.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
                  <LinearGradient
                    colors={colors.gradient.primary}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ height: '100%', width: `${Math.min(report.budgetSummary.budgetProgressRate, 100)}%`, borderRadius: 4 }}
                  />
                </View>
                <Text style={{ fontSize: 12, color: colors.text.secondary, textAlign: 'right' }}>
                  {report.budgetSummary.budgetProgressRate.toFixed(1)}% 소진
                </Text>
              </View>
            </View>
          )}

          {report.transactions.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <SectionHeader title="카테고리별 지출" />
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, overflow: 'hidden', ...shadow.card }}>
                {report.transactions.map((tx, idx) => (
                  <View
                    key={`${tx.categoryName}-${idx}`}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: idx < report.transactions.length - 1 ? 1 : 0,
                      borderBottomColor: colors.system.divider,
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, color: colors.text.primary }}>{tx.categoryName}</Text>
                    <Text style={{ fontSize: 12, color: colors.text.tertiary, marginRight: 12 }}>
                      {tx.count}건
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                      {formatCurrency(tx.totalAmount, tx.currency)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={handleDownloadPdf}
            disabled={isDownloading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={isDownloading ? ['#E5E7EB', '#E5E7EB', '#E5E7EB'] : colors.gradient.primary}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{
                borderRadius: radius.button, paddingVertical: 15,
                alignItems: 'center', flexDirection: 'row',
                justifyContent: 'center', gap: 8,
              }}
            >
              {isDownloading ? (
                <ActivityIndicator color={colors.text.inverse} />
              ) : (
                <>
                  <Text style={{ fontSize: 16 }}>📄</Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.inverse }}>
                    PDF로 내보내기
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
