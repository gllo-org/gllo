import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { apiClient } from '@/lib/api/client';
import { colors, spacing, radius, shadow } from '@/theme';
import type { CurrencyCode } from '@/theme';

type Purpose = 'EXCHANGE_STUDENT' | 'WORKING_HOLIDAY' | 'IMMIGRATION' | 'LONG_TERM_TRAVEL';
type Step = 1 | 2 | 3 | 4;

const PURPOSES = [
  { value: 'EXCHANGE_STUDENT' as Purpose, emoji: '🎓', label: '교환학생', desc: '대학 파견·방문학생 프로그램' },
  { value: 'WORKING_HOLIDAY' as Purpose, emoji: '🧳', label: '워킹홀리데이', desc: '일하며 여행하는 생활' },
  { value: 'IMMIGRATION' as Purpose, emoji: '🏡', label: '이민', desc: '장기 거주·영주권 준비' },
  { value: 'LONG_TERM_TRAVEL' as Purpose, emoji: '🗺️', label: '장기여행', desc: '자유롭게 여행하는 삶' },
];

type Country = { label: string; flag: string; currency: CurrencyCode };

const COUNTRIES: Country[] = [
  { label: '독일', flag: '🇩🇪', currency: 'EUR' },
  { label: '프랑스', flag: '🇫🇷', currency: 'EUR' },
  { label: '네덜란드', flag: '🇳🇱', currency: 'EUR' },
  { label: '스페인', flag: '🇪🇸', currency: 'EUR' },
  { label: '오스트리아', flag: '🇦🇹', currency: 'EUR' },
  { label: '기타 유럽', flag: '🇪🇺', currency: 'EUR' },
  { label: '미국', flag: '🇺🇸', currency: 'USD' },
  { label: '영국', flag: '🇬🇧', currency: 'GBP' },
  { label: '한국', flag: '🇰🇷', currency: 'KRW' },
];

function getTemplates(): string[] {
  return ['식비', '주거비', '쇼핑', '통신비', '교통비', '급여', '용돈'];
}

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i + 1 === current ? 20 : 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i + 1 === current
              ? colors.text.brand
              : i + 1 < current ? colors.gradient.primary[0] : colors.system.border,
          }}
        />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  async function handleSkip() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0];
      await apiClient('/user/profile/onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          purpose: 'LONG_TERM_TRAVEL',
          country: '기타',
          stayStartDate: today,
          stayEndDate: nextYear,
        }),
      });
    } catch {}
    router.replace('/(tabs)');
  }
  const [selectedPurpose, setSelectedPurpose] = useState<Purpose | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);

  const [startYear, setStartYear] = useState('2026');
  const [startMonth, setStartMonth] = useState('03');
  const [startDay, setStartDay] = useState('01');
  const [endYear, setEndYear] = useState('2026');
  const [endMonth, setEndMonth] = useState('08');
  const [endDay, setEndDay] = useState('31');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const startMonthRef = useRef<TextInput>(null);
  const startDayRef = useRef<TextInput>(null);
  const endYearRef = useRef<TextInput>(null);
  const endMonthRef = useRef<TextInput>(null);
  const endDayRef = useRef<TextInput>(null);

  function buildDate(y: string, m: string, d: string): string {
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  function isDurationValid(): boolean {
    const start = new Date(buildDate(startYear, startMonth, startDay));
    const end = new Date(buildDate(endYear, endMonth, endDay));
    return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end > start;
  }

  async function handleSubmitOnboarding() {
    if (!selectedPurpose || !selectedCountry || !isDurationValid()) return;
    setIsSubmitting(true);
    try {
      await apiClient('/user/profile/onboarding', {
        method: 'PUT',
        body: JSON.stringify({
          purpose: selectedPurpose,
          country: selectedCountry.label,
          stayStartDate: buildDate(startYear, startMonth, startDay),
          stayEndDate: buildDate(endYear, endMonth, endDay),
        }),
      });
      await createDefaultAccounts(selectedCountry);
      setStep(4);
    } catch {
      Alert.alert('오류', '글로가 정보를 저장하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function createDefaultAccounts(country: Country) {
    try {
      await apiClient('/accounts', {
        method: 'POST',
        body: JSON.stringify({ name: '한국 계좌', type: 'BANK', currency: 'KRW', initialBalance: 0 }),
      });
      if (country.currency !== 'KRW') {
        await apiClient('/accounts', {
          method: 'POST',
          body: JSON.stringify({ name: `${country.label} 계좌`, type: 'BANK', currency: country.currency, initialBalance: 0 }),
        });
      }
    } catch {
      Alert.alert('알림', '기본 계좌 생성에 실패했어요. 계좌 탭에서 직접 추가해주세요.');
    }
  }

  function renderStep1() {
    return (
      <View style={{ flex: 1 }}>
        <ProgressDots current={1} total={3} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
          해외 생활 목적이 무엇인가요?
        </Text>
        <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: 28, lineHeight: 22 }}>
          글로가 체류 목적에 맞게 예산 카테고리를 준비해드려요.
        </Text>

        <View style={{ gap: 12 }}>
          {PURPOSES.map((p) => {
            const selected = selectedPurpose === p.value;
            return (
              <TouchableOpacity
                key={p.value}
                onPress={() => setSelectedPurpose(p.value)}
                activeOpacity={0.8}
              >
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 18,
                  borderRadius: radius.card,
                  borderWidth: 2,
                  borderColor: selected ? colors.text.brand : colors.system.border,
                  backgroundColor: selected ? colors.bg.surface : colors.bg.screen,
                  ...(selected ? shadow.card : {}),
                }}>
                  <Text style={{ fontSize: 28, marginRight: 14 }}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: selected ? colors.text.brand : colors.text.primary,
                      marginBottom: 2,
                    }}>
                      {p.label}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text.tertiary }}>
                      {p.desc}
                    </Text>
                  </View>
                  {selected && (
                    <View style={{
                      width: 20, height: 20, borderRadius: 10,
                      backgroundColor: colors.text.brand,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Text style={{ fontSize: 12, color: colors.text.inverse, fontWeight: '700' }}>✓</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => setStep(2)}
          disabled={!selectedPurpose}
          style={{ marginTop: 24 }}
        >
          <LinearGradient
            colors={selectedPurpose ? colors.gradient.primary : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: radius.button, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{
              fontSize: 16, fontWeight: '600',
              color: selectedPurpose ? colors.text.inverse : colors.text.tertiary,
            }}>
              다음
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  function renderStep2() {
    return (
      <View style={{ flex: 1 }}>
        <ProgressDots current={2} total={3} />
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
          어느 나라로 가시나요?
        </Text>
        <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: 20, lineHeight: 22 }}>
          기본 통화가 자동으로 설정돼요.
        </Text>

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          <View style={{ gap: 10 }}>
            {COUNTRIES.map((c) => {
              const selected = selectedCountry?.label === c.label;
              const currencyColor = colors.currency[c.currency];
              return (
                <TouchableOpacity
                  key={c.label}
                  onPress={() => setSelectedCountry(c)}
                  activeOpacity={0.8}
                >
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 16,
                    borderRadius: radius.card,
                    borderWidth: 2,
                    borderColor: selected ? colors.text.brand : colors.system.border,
                    backgroundColor: selected ? colors.bg.surface : colors.bg.screen,
                  }}>
                    <Text style={{ fontSize: 26, marginRight: 12 }}>{c.flag}</Text>
                    <Text style={{
                      flex: 1,
                      fontSize: 16, fontWeight: '500',
                      color: selected ? colors.text.brand : colors.text.primary,
                    }}>
                      {c.label}
                    </Text>
                    <View style={{
                      paddingHorizontal: 10, paddingVertical: 4,
                      borderRadius: radius.chip,
                      backgroundColor: currencyColor.bg,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: currencyColor.text }}>
                        {c.currency}
                      </Text>
                    </View>
                    {selected && (
                      <View style={{
                        width: 20, height: 20, borderRadius: 10,
                        backgroundColor: colors.text.brand,
                        alignItems: 'center', justifyContent: 'center',
                        marginLeft: 10,
                      }}>
                        <Text style={{ fontSize: 12, color: colors.text.inverse, fontWeight: '700' }}>✓</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 24 }} />
        </ScrollView>

        <TouchableOpacity
          onPress={() => setStep(3)}
          disabled={!selectedCountry}
          style={{ marginTop: 12 }}
        >
          <LinearGradient
            colors={selectedCountry ? colors.gradient.primary : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: radius.button, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{
              fontSize: 16, fontWeight: '600',
              color: selectedCountry ? colors.text.inverse : colors.text.tertiary,
            }}>
              다음
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  function DateInputRow({
    label,
    year, month, day,
    onYearChange, onMonthChange, onDayChange,
    yearRef, monthRef, dayRef,
    nextRef,
  }: {
    label: string;
    year: string; month: string; day: string;
    onYearChange: (v: string) => void;
    onMonthChange: (v: string) => void;
    onDayChange: (v: string) => void;
    yearRef?: React.RefObject<TextInput | null>;
    monthRef?: React.RefObject<TextInput | null>;
    dayRef?: React.RefObject<TextInput | null>;
    nextRef?: React.RefObject<TextInput | null>;
  }) {
    const inputStyle = {
      backgroundColor: colors.bg.input,
      borderRadius: radius.input,
      borderWidth: 1.5,
      borderColor: colors.system.border,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text.primary,
      textAlign: 'center' as const,
    };
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 8, fontWeight: '500' }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            ref={yearRef}
            value={year}
            onChangeText={(v) => {
              const clean = v.replace(/\D/g, '').slice(0, 4);
              onYearChange(clean);
              if (clean.length === 4) monthRef?.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={4}
            style={{ ...inputStyle, flex: 2 }}
            placeholder="YYYY"
            placeholderTextColor={colors.text.tertiary}
          />
          <Text style={{ fontSize: 16, color: colors.text.tertiary }}>년</Text>
          <TextInput
            ref={monthRef}
            value={month}
            onChangeText={(v) => {
              const clean = v.replace(/\D/g, '').slice(0, 2);
              onMonthChange(clean);
              if (clean.length === 2) dayRef?.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="MM"
            placeholderTextColor={colors.text.tertiary}
          />
          <Text style={{ fontSize: 16, color: colors.text.tertiary }}>월</Text>
          <TextInput
            ref={dayRef}
            value={day}
            onChangeText={(v) => {
              const clean = v.replace(/\D/g, '').slice(0, 2);
              onDayChange(clean);
              if (clean.length === 2) nextRef?.current?.focus();
            }}
            keyboardType="number-pad"
            maxLength={2}
            style={{ ...inputStyle, flex: 1 }}
            placeholder="DD"
            placeholderTextColor={colors.text.tertiary}
            returnKeyType={nextRef ? 'next' : 'done'}
          />
          <Text style={{ fontSize: 16, color: colors.text.tertiary }}>일</Text>
        </View>
      </View>
    );
  }

  function renderStep3() {
    const valid = isDurationValid();
    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ flex: 1 }}>
          <ProgressDots current={3} total={3} />
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
            체류 기간을 알려주세요
          </Text>
          <Text style={{ fontSize: 15, color: colors.text.secondary, marginBottom: 28, lineHeight: 22 }}>
            글로가 체류 기간에 맞게 예산 계획을 도와드려요.
          </Text>

          <DateInputRow
            label="시작일"
            year={startYear} month={startMonth} day={startDay}
            onYearChange={setStartYear}
            onMonthChange={setStartMonth}
            onDayChange={setStartDay}
            monthRef={startMonthRef}
            dayRef={startDayRef}
            nextRef={endYearRef}
          />

          <DateInputRow
            label="종료일"
            year={endYear} month={endMonth} day={endDay}
            onYearChange={setEndYear}
            onMonthChange={setEndMonth}
            onDayChange={setEndDay}
            yearRef={endYearRef}
            monthRef={endMonthRef}
            dayRef={endDayRef}
          />

          {startYear.length === 4 && startMonth.length >= 1 && startDay.length >= 1 &&
           endYear.length === 4 && endMonth.length >= 1 && endDay.length >= 1 && !valid && (
            <Text style={{ fontSize: 13, color: colors.loss.text, marginTop: -12, marginBottom: 12 }}>
              종료일이 시작일보다 늦어야 해요.
            </Text>
          )}

          {selectedCountry && (
            <View style={{
              backgroundColor: colors.currency[selectedCountry.currency].bg,
              borderRadius: radius.card,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
              <Text style={{ fontSize: 20 }}>{selectedCountry.flag}</Text>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary }}>
                  기본 통화
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.currency[selectedCountry.currency].text }}>
                  {selectedCountry.currency} — {selectedCountry.label}
                </Text>
              </View>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={handleSubmitOnboarding}
            disabled={!valid || isSubmitting}
            style={{ marginTop: 24 }}
          >
            <LinearGradient
              colors={valid && !isSubmitting ? colors.gradient.primary : ['#E5E7EB', '#E5E7EB', '#E5E7EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: radius.button, paddingVertical: 16, alignItems: 'center' }}
            >
              {isSubmitting
                ? <ActivityIndicator color={colors.text.inverse} />
                : (
                  <Text style={{
                    fontSize: 16, fontWeight: '600',
                    color: valid ? colors.text.inverse : colors.text.tertiary,
                  }}>
                    글로 시작하기
                  </Text>
                )
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  function renderStep4() {
    const templates = getTemplates();
    const purposeLabel = PURPOSES.find(p => p.value === selectedPurpose)?.label ?? '';

    return (
      <View style={{ flex: 1, alignItems: 'center' }}>
        <LinearGradient
          colors={colors.gradient.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 88, height: 88,
            borderRadius: 44,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <Text style={{ fontSize: 40 }}>💜</Text>
        </LinearGradient>

        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary, textAlign: 'center', marginBottom: 10 }}>
          글로에 오신 걸 환영해요!
        </Text>
        <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 }}>
          글로가 {selectedCountry?.flag} {selectedCountry?.label} {purposeLabel}에게{'\n'}꼭 필요한 카테고리를 준비해뒀어요.
        </Text>

        <View style={{
          width: '100%',
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          padding: spacing.cardPadding,
          marginBottom: 24,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.secondary, marginBottom: 12 }}>
            초기 예산 카테고리
          </Text>
          {templates.map((t, i) => (
            <View key={t} style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < templates.length - 1 ? 1 : 0,
              borderBottomColor: colors.system.divider,
            }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: colors.gradient.primary[0] + '40',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.brand }}>✓</Text>
              </View>
              <Text style={{ fontSize: 15, color: colors.text.primary }}>{t}</Text>
            </View>
          ))}
        </View>

        <View style={{
          width: '100%',
          backgroundColor: colors.currency[selectedCountry?.currency ?? 'EUR'].bg,
          borderRadius: radius.card,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 32,
        }}>
          <Text style={{ fontSize: 20 }}>{selectedCountry?.flag}</Text>
          <View>
            <Text style={{ fontSize: 12, color: colors.text.secondary }}>설정된 기본 통화</Text>
            <Text style={{
              fontSize: 15, fontWeight: '700',
              color: colors.currency[selectedCountry?.currency ?? 'EUR'].text,
            }}>
              {selectedCountry?.currency} — {selectedCountry?.label}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={colors.gradient.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: radius.button, paddingVertical: 16, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.inverse }}>
              대시보드로 이동
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const canGoBackStep = step === 2 || step === 3;
  const canGoBackRoute = step === 1 && router.canGoBack();
  const headerTitle = step === 4 ? '' : ['', '체류 목적', '거주 국가', '체류 기간'][step];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: 16,
          paddingBottom: 24,
        }}>
          {canGoBackStep ? (
            <TouchableOpacity
              onPress={() => setStep((prev) => (prev - 1) as Step)}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
            </TouchableOpacity>
          ) : canGoBackRoute ? (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <Text style={{ fontSize: 22, color: colors.text.primary }}>←</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
          {headerTitle ? (
            <Text style={{
              flex: 1, textAlign: 'center',
              fontSize: 16, fontWeight: '600', color: colors.text.primary,
            }}>
              {headerTitle}
            </Text>
          ) : <View style={{ flex: 1 }} />}
          {step !== 4 ? (
            <TouchableOpacity onPress={handleSkip} style={{ width: 36, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 13, color: colors.text.tertiary }}>건너뛰기</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </View>
    </SafeAreaView>
  );
}
