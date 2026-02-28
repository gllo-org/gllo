import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import {
  getLastEmail, saveLastEmail,
  incrementPinFailures, resetPinFailures,
  MAX_PIN_FAILURES,
} from '@/lib/auth/pinAuth';
import { supabase } from '@/lib/supabase';
import { PinPad } from '@/components/ui/PinPad';

type Mode = 'pin' | 'email';

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('email');
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const shakeAnim = new Animated.Value(0);
  const { sendOtp, setSession } = useAuthStore();
  const router = useRouter();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    async function init() {
      const saved = await getLastEmail();
      if (saved) {
        setLastEmail(saved);
        setMode('pin');
      }
      if (Platform.OS !== 'web') {
        const hw = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setHasBiometrics(hw && enrolled);
      }
    }
    init();
  }, []);

  function shake() {
    setPinError(true);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => setTimeout(() => setPinError(false), 400));
  }

  async function handleBiometrics() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: '생체인증으로 로그인',
      cancelLabel: '취소',
    });
    if (!result.success) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await resetPinFailures();
      setSession(session);
    } else {
      Alert.alert('세션 만료', 'PIN을 입력해 다시 로그인해주세요.');
    }
  }

  async function handlePinSubmit() {
    if (!lastEmail || pin.length !== 4) return;
    setIsLoading(true);
    setPinError(false);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: lastEmail,
        password: pin,
      });
      if (error) throw error;
      await resetPinFailures();
      await saveLastEmail(lastEmail);
      setSession(data.session);
    } catch {
      setPin('');
      shake();
      const failures = await incrementPinFailures();
      if (failures >= MAX_PIN_FAILURES) {
        Alert.alert(
          'PIN 오류 5회',
          '보안을 위해 이메일 인증이 필요해요.',
          [{ text: '확인', onPress: () => { setMode('email'); setPinError(false); } }],
        );
      } else {
        Alert.alert('PIN 오류', `${MAX_PIN_FAILURES - failures}회 더 실패하면 이메일 인증이 필요해요.`);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!isValidEmail) return;
    setIsLoading(true);
    try {
      await sendOtp(email);
      router.push({ pathname: '/(auth)/verify', params: { email } });
    } catch {
      Alert.alert('오류', '글로가 이메일을 전송하지 못했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  if (mode === 'pin' && lastEmail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
        <LinearGradient
          colors={colors.gradient.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220 }}
        />

        <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding, alignItems: 'center' }}>
          <View style={{ paddingTop: 64, paddingBottom: 40, alignItems: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: colors.text.primary, marginBottom: 20 }}>
              글로
            </Text>
            <View style={{
              paddingHorizontal: 16, paddingVertical: 8,
              borderRadius: radius.chip,
              backgroundColor: colors.bg.surface,
              borderWidth: 1.5,
              borderColor: colors.system.border,
            }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                {lastEmail}
              </Text>
            </View>
          </View>

          {hasBiometrics && (
            <TouchableOpacity
              onPress={handleBiometrics}
              style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: colors.bg.surface,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1.5, borderColor: colors.system.border,
                marginBottom: 32,
              }}
            >
              <Text style={{ fontSize: 30 }}>🔐</Text>
            </TouchableOpacity>
          )}

          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: 32 }}>
            PIN 입력
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinPad
              value={pin}
              onChange={setPin}
              onSubmit={handlePinSubmit}
              error={pinError}
            />
          </Animated.View>

          {isLoading && (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.text.brand} />
          )}

          <TouchableOpacity
            onPress={() => { setMode('email'); setPin(''); setPinError(false); }}
            style={{ marginTop: 36 }}
          >
            <Text style={{ fontSize: 14, color: colors.text.secondary }}>
              다른 계정으로 로그인
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient
          colors={colors.gradient.light}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: 280,
          }}
        />

        <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding }}>
          <View style={{ paddingTop: 64, paddingBottom: 48 }}>
            <Text style={{ fontSize: 32, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
              글로
            </Text>
            <Text style={{ fontSize: 16, color: colors.text.secondary, lineHeight: 24 }}>
              글로와 함께 해외 생활{'\n'}첫 가계부를 시작해볼까요?
            </Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
              이메일로 시작하기
            </Text>
            <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 24 }}>
              글로가 인증번호를 이메일로 보내드려요.
            </Text>

            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="이메일 주소 입력"
              placeholderTextColor={colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              style={{
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                paddingHorizontal: 16,
                paddingVertical: 16,
                fontSize: 16,
                color: colors.text.primary,
                borderWidth: 1.5,
                borderColor: email.length > 0 && !isValidEmail
                  ? colors.loss.text
                  : isValidEmail ? colors.gradient.primary[0] : colors.system.border,
                marginBottom: 8,
              }}
            />

            {email.length > 0 && !isValidEmail && (
              <Text style={{ fontSize: 12, color: colors.loss.text, marginBottom: 16 }}>
                이메일 형식을 확인해주세요.
              </Text>
            )}

            <TouchableOpacity
              onPress={handleSendOtp}
              disabled={!isValidEmail || isLoading}
              style={{ marginTop: 8 }}
            >
              <LinearGradient
                colors={isValidEmail && !isLoading
                  ? colors.gradient.primary
                  : ['#E5E7EB', '#E5E7EB', '#E5E7EB']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: radius.button,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                {isLoading
                  ? <ActivityIndicator color={colors.text.inverse} />
                  : (
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '600',
                      color: isValidEmail ? colors.text.inverse : colors.text.tertiary,
                    }}>
                      인증번호 받기
                    </Text>
                  )
                }
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.text.tertiary,
            paddingBottom: 24,
          }}>
            로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
