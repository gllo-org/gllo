import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { formatCurrency, CURRENCY_FLAGS } from '@/lib/utils/currency';
import { Flag } from '@/components/ui/Flag';
import { useTheme, spacing, radius, shadow } from '@/theme';
import type { CurrencyCode } from '@/theme';
import { ArrowLeft, X, Plane, Plus } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.85;
const DETAIL_H = SCREEN_H * 0.60;

interface Trip {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  budgetCurrency: CurrencyCode;
  active: boolean;
  createdAt: string;
}

const CURRENCIES: CurrencyCode[] = ['KRW', 'EUR', 'USD', 'GBP'];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function TripDetailSheet({
  trip,
  visible,
  onClose,
  onEdit,
}: {
  trip: Trip | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (trip: Trip) => void;
}) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(DETAIL_H)).current;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }).start();
    } else {
      translateY.setValue(DETAIL_H);
    }
  }, [visible]);

  function closeSheet() {
    Animated.timing(translateY, { toValue: DETAIL_H, duration: 220, useNativeDriver: true })
      .start(() => onClose());
  }

  const { mutateAsync: completeTrip, isPending: isCompleting } = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/trips/${id}/complete`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const { mutateAsync: deleteTrip, isPending: isDeleting } = useMutation({
    mutationFn: (id: number) =>
      apiClient(`/trips/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  const isPending = isCompleting || isDeleting;

  function handleComplete() {
    if (!trip) return;
    showAlert(
      '여행 완료',
      `"${trip.name}" 여행을 완료 처리할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완료',
          onPress: async () => {
            try {
              await completeTrip(trip.id);
              closeSheet();
              showAlert('완료', '여행이 완료 처리되었어요.');
            } catch {
              showAlert('오류', '처리에 실패했어요. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  }

  function handleDelete() {
    if (!trip) return;
    showAlert(
      '여행 삭제',
      `"${trip.name}" 여행을 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTrip(trip.id);
              closeSheet();
            } catch {
              showAlert('오류', '삭제에 실패했어요. 다시 시도해주세요.');
            }
          },
        },
      ]
    );
  }

  if (!trip) return null;

  const cc = colors.currency[trip.budgetCurrency];
  const now = new Date();
  const end = new Date(trip.endDate);
  const start = new Date(trip.startDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / 86400000);
  const daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));

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
          height: DETAIL_H,
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
            paddingHorizontal: spacing.screenPadding, paddingVertical: 14,
          }}>
            <Text style={{ flex: 1, fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
              여행 상세
            </Text>
            <TouchableOpacity
              onPress={() => { closeSheet(); setTimeout(() => onEdit(trip), 250); }}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.text.brand }}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={{ marginRight: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: 14, fontFamily: 'Pretendard-SemiBold', color: colors.loss.text }}>삭제</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={closeSheet} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={22} color={colors.text.tertiary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.screenPadding, paddingBottom: 32 }}>
            <LinearGradient
              colors={colors.gradient.hero}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{ borderRadius: radius.card, padding: 20, marginBottom: 16 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Plane size={32} color={colors.accent.primary} strokeWidth={1.7} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 18, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
                    {trip.name}
                  </Text>
                  <View style={{
                    alignSelf: 'flex-start',
                    marginTop: 4,
                    paddingHorizontal: 8, paddingVertical: 3,
                    borderRadius: radius.chip,
                    backgroundColor: trip.active ? colors.status.normal + '22' : colors.neutral.bg,
                  }}>
                    <Text style={{
                      fontSize: 11, fontFamily: 'Pretendard-SemiBold',
                      color: trip.active ? colors.status.normal : colors.neutral.text,
                    }}>
                      {trip.active ? '진행 중' : '완료'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>기간</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                    {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>총 기간</Text>
                  <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>
                    {totalDays}일
                  </Text>
                </View>
                {trip.active && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13, color: colors.text.secondary }}>남은 날</Text>
                    <Text style={{
                      fontSize: 13, fontFamily: 'Pretendard-SemiBold',
                      color: daysLeft < 7 ? colors.status.warning : colors.text.primary,
                    }}>
                      {daysLeft}일
                    </Text>
                  </View>
                )}
                <View style={{ height: 1, backgroundColor: colors.system.divider }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 13, color: colors.text.secondary }}>예산</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Flag code={CURRENCY_FLAGS[trip.budgetCurrency]} size={20} />
                    <Text style={{ fontSize: 15, fontFamily: 'Pretendard-Bold', color: cc.text }}>
                      {formatCurrency(trip.budget, trip.budgetCurrency)}
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {trip.active && (
              <TouchableOpacity
                onPress={handleComplete}
                disabled={isPending}
                activeOpacity={0.85}
                accessibilityRole="button"
                style={{
                  backgroundColor: isPending ? colors.bg.input : colors.accent.primary,
                  borderRadius: radius.button, paddingVertical: 14, alignItems: 'center',
                }}
              >
                {isPending
                  ? <ActivityIndicator color={colors.text.inverse} />
                  : <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>여행 완료 처리</Text>
                }
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function TripFormSheet({
  visible,
  editTrip,
  onClose,
}: {
  visible: boolean;
  editTrip?: Trip | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetStr, setBudgetStr] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState<CurrencyCode>('EUR');

  useEffect(() => {
    if (visible) {
      setName(editTrip?.name ?? '');
      setStartDate(editTrip?.startDate ?? '');
      setEndDate(editTrip?.endDate ?? '');
      setBudgetStr(editTrip?.budget?.toString() ?? '');
      setBudgetCurrency(editTrip?.budgetCurrency ?? 'EUR');
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
    Animated.timing(translateY, { toValue: SHEET_H, duration: 220, useNativeDriver: true })
      .start(() => onClose());
  }

  const { mutateAsync: saveTrip, isPending } = useMutation({
    mutationFn: (body: object) =>
      apiClient(editTrip ? `/trips/${editTrip.id}` : '/trips', {
        method: editTrip ? 'PATCH' : 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });

  function validateDate(str: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(new Date(str).getTime());
  }

  async function handleSave() {
    if (!name.trim()) { showAlert('', '여행 이름을 입력해주세요.'); return; }
    if (!validateDate(startDate)) { showAlert('', '시작일을 YYYY-MM-DD 형식으로 입력해주세요.'); return; }
    if (!validateDate(endDate)) { showAlert('', '종료일을 YYYY-MM-DD 형식으로 입력해주세요.'); return; }
    if (new Date(endDate) <= new Date(startDate)) { showAlert('', '종료일이 시작일보다 늦어야 해요.'); return; }
    const budget = parseFloat(budgetStr);
    if (!budget || budget <= 0) { showAlert('', '예산을 입력해주세요.'); return; }

    try {
      await saveTrip({
        name: name.trim(),
        startDate,
        endDate,
        budget,
        budgetCurrency,
      });
      closeSheet();
    } catch {
      showAlert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bg.overlay }} activeOpacity={1} onPress={closeSheet} />
        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
          backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom,
          borderTopRightRadius: radius.bottom,
          transform: [{ translateY }],
        }}>
          <View style={{ alignItems: 'center', paddingTop: 10 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.system.border }} />
          </View>

          <ScrollView
            contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary, marginBottom: 20 }}>
              {editTrip ? '여행 수정' : '새 여행 추가'}
            </Text>

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>여행 이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="예: 파리 여행, 베를린 주말"
              placeholderTextColor={colors.text.tertiary}
              style={{
                fontSize: 16, color: colors.text.primary,
                backgroundColor: colors.bg.input, borderRadius: radius.input,
                padding: 14, marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>시작일</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={{
                fontSize: 16, color: colors.text.primary,
                backgroundColor: colors.bg.input, borderRadius: radius.input,
                padding: 14, marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>종료일</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
              style={{
                fontSize: 16, color: colors.text.primary,
                backgroundColor: colors.bg.input, borderRadius: radius.input,
                padding: 14, marginBottom: 16,
              }}
            />

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>예산 통화</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {CURRENCIES.map((c) => {
                const active = budgetCurrency === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setBudgetCurrency(c)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: radius.chip,
                      backgroundColor: active ? colors.currency[c].bg : 'transparent',
                      alignItems: 'center', borderWidth: 1.5,
                      borderColor: active ? colors.currency[c].primary : colors.system.border,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: 'Pretendard-Bold', color: active ? colors.currency[c].text : colors.text.tertiary }}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>예산</Text>
            <TextInput
              value={budgetStr}
              onChangeText={setBudgetStr}
              placeholder="0"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="decimal-pad"
              style={{
                fontSize: 16, color: colors.text.primary,
                backgroundColor: colors.bg.input, borderRadius: radius.input,
                padding: 14, marginBottom: 28,
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isPending}
              activeOpacity={0.85}
              accessibilityRole="button"
              style={{
                backgroundColor: isPending ? colors.bg.input : colors.accent.primary,
                borderRadius: radius.button, paddingVertical: 15, alignItems: 'center',
              }}
            >
              {isPending
                ? <ActivityIndicator color={colors.text.inverse} />
                : <Text style={{ fontSize: 16, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>저장하기</Text>
              }
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const TRIPS_ENABLED = false;

export default function TripsScreen() {
  const { colors } = useTheme();
  if (!TRIPS_ENABLED) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: spacing.screenPadding }}>
          <Plane size={40} color={colors.text.tertiary} strokeWidth={1.6} />
          <Text style={{ fontSize: 17, fontFamily: 'SUIT-Bold', color: colors.text.primary }}>
            여행 기능은 준비 중이에요
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center', lineHeight: 20 }}>
            더 나은 경험을 위해 다듬고 있어요.{'\n'}곧 만나볼 수 있어요!
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  return <TripsScreenImpl />;
}

function TripsScreenImpl() {
  const { colors } = useTheme();
  const router = useRouter();
  const [formVisible, setFormVisible] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data: trips = [], isLoading } = useQuery({
    queryKey: ['trips'],
    queryFn: () => apiClient<Trip[]>('/trips'),
  });

  const activeTrips = trips.filter((t) => t.active);
  const completedTrips = trips.filter((t) => !t.active);

  function TripCard({ trip }: { trip: Trip }) {
    const cc = colors.currency[trip.budgetCurrency];
    const now = new Date();
    const end = new Date(trip.endDate);
    const isPast = end < now;
    const daysLeft = Math.ceil((end.getTime() - now.getTime()) / 86400000);

    return (
      <TouchableOpacity
        onPress={() => setSelectedTrip(trip)}
        activeOpacity={0.85}
        style={{
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          padding: 16,
          marginBottom: 12,
          ...shadow.card,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
          <View style={{ marginRight: 12 }}><Plane size={28} color={colors.accent.primary} strokeWidth={1.7} /></View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-Bold', color: colors.text.primary, flex: 1 }}>
                {trip.name}
              </Text>
              <View style={{
                paddingHorizontal: 8, paddingVertical: 3,
                borderRadius: radius.chip,
                backgroundColor: trip.active ? colors.status.normal + '22' : colors.neutral.bg,
              }}>
                <Text style={{
                  fontSize: 11, fontFamily: 'Pretendard-SemiBold',
                  color: trip.active ? colors.status.normal : colors.neutral.text,
                }}>
                  {trip.active ? '진행 중' : '완료'}
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginTop: 3 }}>
              {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{
            backgroundColor: cc.bg, borderRadius: radius.chip,
            paddingHorizontal: 10, paddingVertical: 5,
            flexDirection: 'row', alignItems: 'center', gap: 6,
          }}>
            <Flag code={CURRENCY_FLAGS[trip.budgetCurrency]} size={18} />
            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: cc.text }}>
              {formatCurrency(trip.budget, trip.budgetCurrency)}
            </Text>
          </View>
          {trip.active && (
            <Text style={{ fontSize: 12, color: isPast ? colors.text.tertiary : daysLeft < 7 ? colors.status.warning : colors.text.tertiary }}>
              {isPast ? '기간 만료' : daysLeft === 0 ? '오늘 종료' : `D-${daysLeft}`}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
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
          여행 기록
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}>
          {trips.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 60, gap: 12 }}>
              <Plane size={48} color={colors.text.tertiary} strokeWidth={1.5} />
              <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.secondary }}>
                여행이 없어요
              </Text>
              <Text style={{ fontSize: 13, color: colors.text.tertiary, textAlign: 'center' }}>
                GLLO와 함께 여행 지출을{'\n'}일상 예산과 분리해 관리해보세요.
              </Text>
            </View>
          ) : (
            <>
              {activeTrips.length > 0 && (
                <>
                  <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.secondary, marginBottom: 10 }}>
                    진행 중
                  </Text>
                  {activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
                </>
              )}
              {completedTrips.length > 0 && (
                <>
                  <Text style={{
                    fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.secondary,
                    marginTop: activeTrips.length > 0 ? 8 : 0, marginBottom: 10,
                  }}>
                    완료된 여행
                  </Text>
                  {completedTrips.map((trip) => <TripCard key={trip.id} trip={trip} />)}
                </>
              )}
            </>
          )}

          <TouchableOpacity
            onPress={() => setFormVisible(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={{
              marginTop: trips.length === 0 ? 8 : 4,
              backgroundColor: colors.accent.primary,
              borderRadius: radius.button, paddingVertical: 14,
              alignItems: 'center', flexDirection: 'row',
              justifyContent: 'center', gap: 6,
            }}
          >
            <Plus size={18} color={colors.text.inverse} strokeWidth={2.4} />
            <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>
              새 여행 추가
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <TripFormSheet
        visible={formVisible || editingTrip !== null}
        editTrip={editingTrip}
        onClose={() => {
          setFormVisible(false);
          setEditingTrip(null);
        }}
      />
      <TripDetailSheet
        trip={selectedTrip}
        visible={selectedTrip !== null}
        onClose={() => setSelectedTrip(null)}
        onEdit={(trip) => {
          setSelectedTrip(null);
          setEditingTrip(trip);
        }}
      />
    </SafeAreaView>
  );
}
