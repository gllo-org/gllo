import { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { colors, spacing, radius, typography } from '@/theme';

const { width: SCREEN_W } = Dimensions.get('window');

const TUTORIAL_SEEN_KEY = 'gllo_tutorial_seen';

const SLIDES = [
  {
    emoji: '🌍',
    gradient: ['#EDE8FF', '#FDE8F2', '#FFF0E8'] as const,
    title: '글로에 오신 걸\n환영해요!',
    description: '해외 생활의 복잡한 자산 관리를\n한 앱에서 해결해요.',
  },
  {
    emoji: '💰',
    gradient: ['#DCFCE7', '#D1FAE5', '#FFF0E8'] as const,
    title: '다중 통화 계좌',
    description: 'EUR, USD, GBP 계좌를 한눈에 관리하고\n환율 평단가를 자동으로 계산해요.',
  },
  {
    emoji: '✈️',
    gradient: ['#E4FDE9', '#FFF5EC', '#DCF4FF'] as const,
    title: '여행 모드',
    description: '여행 경비를 일상 지출과 분리해서\n깔끔하게 관리해요.',
  },
  {
    emoji: '📊',
    gradient: ['#EDE8FF', '#FDE8F2', '#EDE8FF'] as const,
    title: '지출 분석',
    description: '카테고리별 지출 패턴을 시각화해서\n소비 습관을 한눈에 파악해요.',
  },
] as const;

export async function markTutorialSeen() {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(TUTORIAL_SEEN_KEY, 'true');
    return;
  }
  await SecureStore.setItemAsync(TUTORIAL_SEEN_KEY, 'true');
}

export async function hasTutorialBeenSeen(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(TUTORIAL_SEEN_KEY) === 'true';
  }
  const value = await SecureStore.getItemAsync(TUTORIAL_SEEN_KEY);
  return value === 'true';
}

export default function TutorialScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const router = useRouter();

  const finish = async () => {
    await markTutorialSeen();
    router.replace('/(tabs)');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_W, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      finish();
    }
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(index);
  };

  const slide = SLIDES[currentIndex];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          paddingHorizontal: spacing.screenPadding,
          paddingTop: 16,
        }}>
          <TouchableOpacity onPress={finish} activeOpacity={0.7}>
            <Text style={{ ...typography.body.small, color: colors.text.tertiary, fontFamily: 'Pretendard-Medium' }}>
              건너뛰기
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={{ width: SCREEN_W, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.screenPadding }}>
              <LinearGradient
                colors={s.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 40,
                }}
              >
                <Text style={{ fontSize: 72 }}>{s.emoji}</Text>
              </LinearGradient>

              <Text style={{
                ...typography.heading.h1,
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: 16,
              }}>
                {s.title}
              </Text>

              <Text style={{
                ...typography.body.medium,
                color: colors.text.secondary,
                textAlign: 'center',
                lineHeight: 26,
              }}>
                {s.description}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ alignItems: 'center', paddingBottom: 48, paddingHorizontal: spacing.screenPadding }}>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
            {SLIDES.map((_, i) => (
              <View key={i} style={{
                width: i === currentIndex ? 20 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentIndex ? colors.text.brand : colors.system.skeleton,
              }} />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.85}
            style={{ width: '100%' }}
          >
            <LinearGradient
              colors={currentIndex === SLIDES.length - 1 ? slide.gradient : colors.gradient.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: 52,
                borderRadius: radius.button,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{
                ...typography.body.medium,
                fontFamily: 'Pretendard-SemiBold',
                color: colors.text.inverse,
              }}>
                {currentIndex === SLIDES.length - 1 ? '글로 시작하기 🚀' : '다음'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
