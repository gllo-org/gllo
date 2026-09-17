import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Platform,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { apiClient } from '@/lib/api/client';
import { formatCurrency } from '@/lib/utils/currency';
import { useTheme, spacing, radius, shadow, typography } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Inbox, FileText, ChevronLeft, ChevronRight } from 'lucide-react-native';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1`;

interface CategoryExpenseDto {
  categoryName: string;
  categoryEmoji: string;
  amount: number;
  percentage: number;
}

interface DailyExpenseDto {
  date: string;
  amount: number;
}

interface MonthlyAnalyticsData {
  yearMonth: string;
  totalIncome: number;
  totalExpense: number;
  currency: CurrencyCode;
  categoryExpenses: CategoryExpenseDto[];
  categoryIncomes: CategoryExpenseDto[];
  dailyExpenses: DailyExpenseDto[];
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
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.tertiary, marginBottom: 10 }}>
      {title}
    </Text>
  );
}

export default function ReportScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [yearMonth, setYearMonth] = useState(() => toYearMonth(new Date()));
  const [isDownloading, setIsDownloading] = useState(false);

  const currentYm = toYearMonth(new Date());
  const isCurrentMonth = yearMonth === currentYm;

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', yearMonth],
    queryFn: () => apiClient<MonthlyAnalyticsData>(`/reports/monthly/${yearMonth}`),
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
            dialogTitle: `GLLO ${formatYearMonth(yearMonth)} 리포트`,
          });
        } else {
          showAlert('다운로드 완료', `${fileUri}에 저장되었어요.`);
        }
      }
    } catch {
      showAlert('오류', 'PDF 다운로드에 실패했어요. 다시 시도해주세요.');
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
          <ArrowLeft size={22} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
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
          <ChevronLeft size={20} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontFamily: 'Pretendard-Bold', color: colors.text.primary, minWidth: 120, textAlign: 'center' }}>
          {formatYearMonth(yearMonth)}
        </Text>
        <TouchableOpacity
          onPress={() => !isCurrentMonth && setYearMonth(nextMonth(yearMonth))}
          style={{ padding: 10, opacity: isCurrentMonth ? 0.3 : 1 }}
          disabled={isCurrentMonth}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ChevronRight size={20} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : isError || !report ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Inbox size={36} color={colors.text.tertiary} strokeWidth={1.6} />
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
            <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 12 }}>
              {formatYearMonth(yearMonth)} 수입/지출 요약
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>수입</Text>
                <Text style={{ ...typography.amount.small, color: colors.profit.text }}>
                  {formatCurrency(report.totalIncome, report.currency)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 4 }}>지출</Text>
                <Text style={{ ...typography.amount.small, color: colors.loss.text }}>
                  {formatCurrency(report.totalExpense, report.currency)}
                </Text>
              </View>
            </View>
          </View>

          {report.categoryExpenses.length > 0 && (
            <View style={{ marginBottom: 20 }}>
              <SectionHeader title="카테고리별 지출" />
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, overflow: 'hidden', ...shadow.card }}>
                {report.categoryExpenses.map((item, idx) => (
                  <View
                    key={`expense-${item.categoryName}-${idx}`}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: idx < report.categoryExpenses.length - 1 ? 1 : 0,
                      borderBottomColor: colors.system.divider,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      {item.categoryEmoji ? (
                        <Text style={{ fontSize: 16, marginRight: 8 }}>{item.categoryEmoji}</Text>
                      ) : null}
                      <Text style={{ flex: 1, fontSize: 14, color: colors.text.primary }}>{item.categoryName}</Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                        {formatCurrency(item.amount, report.currency)}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: colors.system.border, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: colors.loss.text,
                        borderRadius: 2,
                      }} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 3, textAlign: 'right' }}>
                      {item.percentage.toFixed(1)}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {report.categoryIncomes.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <SectionHeader title="카테고리별 수입" />
              <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, overflow: 'hidden', ...shadow.card }}>
                {report.categoryIncomes.map((item, idx) => (
                  <View
                    key={`income-${item.categoryName}-${idx}`}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 13,
                      borderBottomWidth: idx < report.categoryIncomes.length - 1 ? 1 : 0,
                      borderBottomColor: colors.system.divider,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      {item.categoryEmoji ? (
                        <Text style={{ fontSize: 16, marginRight: 8 }}>{item.categoryEmoji}</Text>
                      ) : null}
                      <Text style={{ flex: 1, fontSize: 14, color: colors.text.primary }}>{item.categoryName}</Text>
                      <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                        {formatCurrency(item.amount, report.currency)}
                      </Text>
                    </View>
                    <View style={{ height: 4, backgroundColor: colors.system.border, borderRadius: 2, overflow: 'hidden' }}>
                      <View style={{
                        height: '100%',
                        width: `${Math.min(item.percentage, 100)}%`,
                        backgroundColor: colors.profit.text,
                        borderRadius: 2,
                      }} />
                    </View>
                    <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 3, textAlign: 'right' }}>
                      {item.percentage.toFixed(1)}%
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
            accessibilityRole="button"
            style={{
              backgroundColor: isDownloading ? colors.bg.input : colors.accent.primary,
              borderRadius: radius.button, paddingVertical: 15,
              alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 8,
            }}
          >
            {isDownloading ? (
              <ActivityIndicator color={colors.text.inverse} />
            ) : (
              <>
                <FileText size={17} color={colors.accent.primary} strokeWidth={2} />
                <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>
                  PDF로 내보내기
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
