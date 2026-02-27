import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';
import { supabase } from '@/lib/supabase';
import { isPinRegistered, markPinRegistered, saveLastEmail } from '@/lib/auth/pinAuth';
import { PinPad } from '@/components/ui/PinPad';

type Step = 'otp' | 'pin-setup' | 'pin-confirm';

const OTP_EXPIRE_SECONDS = 300;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRE_SECONDS);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const { sendOtp, setPendingPinSetup, setSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timerText = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

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

  async function handleVerify() {
    if (otp.length !== 6) return;
    setIsLoading(true);
    setPendingPinSetup(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email!,
        token: otp,
        type: 'email',
      });
      if (error) throw error;

      const userId = data.session?.user?.id;
      if (!userId) throw new Error('사용자 정보 없음');

      if (await isPinRegistered(userId)) {
        await saveLastEmail(email!);
        setPendingPinSetup(false);
        setSession(data.session);
      } else {
        setPendingUserId(userId);
        setSession(data.session);
        setStep('pin-setup');
      }
    } catch {
      setPendingPinSetup(false);
      Alert.alert('인증 실패', '인증번호를 다시 확인해주세요.');
      setOtp('');
      inputRef.current?.focus();
    } finally {
      setIsLoading(false);
    }
  }

  function handlePinNext() {
    if (pin.length !== 6) return;
    setConfirmPin('');
    setStep('pin-confirm');
  }

  async function handlePinConfirm() {
    if (confirmPin.length !== 6) return;
    if (confirmPin !== pin) {
      shake();
      setConfirmPin('');
      return;
    }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: pin });
      if (error) throw error;
      await markPinRegistered(pendingUserId!);
      await saveLastEmail(email!);
      setPendingPinSetup(false);
    } catch {
      Alert.alert('오류', 'PIN 설정에 실패했어요. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResend() {
    if (!email) return;
    try {
      await sendOtp(email);
      setSecondsLeft(OTP_EXPIRE_SECONDS);
      setOtp('');
      Alert.alert('재전송 완료', '글로가 새 인증번호를 보냈어요.');
    } catch {
      Alert.alert('오류', '다시 시도해주세요.');
    }
  }

  if (step === 'pin-setup' || step === 'pin-confirm') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
        <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20 }}>
          <TouchableOpacity
            onPress={() => {
              if (step === 'pin-confirm') {
                setConfirmPin('');
                setStep('pin-setup');
              } else {
                setPendingPinSetup(false);
                router.back();
              }
            }}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 8, textAlign: 'center' }}>
            {step === 'pin-setup' ? 'PIN을 설정해주세요' : 'PIN을 다시 입력해주세요'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 48, textAlign: 'center', lineHeight: 22 }}>
            {step === 'pin-setup'
              ? '로그인할 때 사용할\n6자리 숫자를 입력해주세요.'
              : '확인을 위해 PIN을 한 번 더 입력해주세요.'}
          </Text>

          <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
            <PinPad
              value={step === 'pin-setup' ? pin : confirmPin}
              onChange={step === 'pin-setup' ? setPin : setConfirmPin}
              onSubmit={step === 'pin-setup' ? handlePinNext : handlePinConfirm}
              error={pinError}
            />
          </Animated.View>

          {step === 'pin-confirm' && pinError && (
            <Text style={{ marginTop: 16, fontSize: 14, color: colors.loss.text }}>
              PIN이 일치하지 않아요. 다시 입력해주세요.
            </Text>
          )}

          {isLoading && (
            <ActivityIndicator style={{ marginTop: 24 }} color={colors.text.brand} />
          )}
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
        <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <Text style={{ fontSize: 24, color: colors.text.primary }}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding }}>
          <View style={{ paddingTop: 32, paddingBottom: 40 }}>
            <Text style={{ fontSize: 24, fontWeight: '700', color: colors.text.primary, marginBottom: 8 }}>
              인증번호 입력
            </Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 22 }}>
              <Text style={{ fontWeight: '600', color: colors.text.primary }}>{email}</Text>
              {'\n'}으로 전송된 6자리 인증번호를 입력해주세요.
            </Text>
          </View>

          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={(text) => {
                const clean = text.replace(/\D/g, '').slice(0, 6);
                setOtp(clean);
                if (clean.length === 6) {
                  setTimeout(() => handleVerify(), 100);
                }
              }}
              keyboardType="number-pad"
              maxLength={6}
              style={{
                fontSize: 32,
                fontWeight: '700',
                letterSpacing: 12,
                color: colors.text.primary,
                textAlign: 'center',
                paddingVertical: 16,
                paddingHorizontal: 24,
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                borderWidth: 2,
                borderColor: otp.length === 6 ? colors.gradient.primary[0] : colors.system.border,
                width: '100%',
              }}
              placeholder="000000"
              placeholderTextColor={colors.text.tertiary}
            />

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 }}>
              <Text style={{ fontSize: 14, color: secondsLeft > 0 ? colors.text.brand : colors.loss.text }}>
                {secondsLeft > 0 ? timerText : '인증번호가 만료되었습니다'}
              </Text>
              {(() => {
                const canResend = secondsLeft <= OTP_EXPIRE_SECONDS - 60;
                return (
                  <TouchableOpacity
                    onPress={canResend ? handleResend : undefined}
                    disabled={!canResend}
                    style={{
                      paddingHorizontal: 12, paddingVertical: 5,
                      borderRadius: 20,
                      backgroundColor: colors.bg.surface,
                      borderWidth: 1,
                      borderColor: canResend ? colors.text.brand : colors.system.border,
                      opacity: canResend ? 1 : 0.4,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: canResend ? colors.text.brand : colors.text.tertiary }}>
                      재전송
                    </Text>
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={otp.length !== 6 || isLoading}
          >
            <LinearGradient
              colors={otp.length === 6 && !isLoading
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
                    color: otp.length === 6 ? colors.text.inverse : colors.text.tertiary,
                  }}>
                    확인
                  </Text>
                )
              }
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
