import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { useTheme, radius, spacing } from '@/theme';
import { supabase } from '@/lib/supabase';
import { saveLastEmail } from '@/lib/auth/pinAuth';
import { ArrowLeft } from 'lucide-react-native';

const OTP_EXPIRE_SECONDS = 300;

export default function VerifyScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRE_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const { sendOtp, setSession } = useAuthStore();
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

  async function handleVerify() {
    if (otp.length !== 6 || isLoading) return;
    setIsLoading(true);
    try {
      const otpTypes = ['email', 'signup'] as const;
      let session = null;
      let lastError: Error | null = null;

      for (const type of otpTypes) {
        const { data, error } = await supabase.auth.verifyOtp({
          email: email!,
          token: otp,
          type,
        });
        if (!error) {
          session = data.session;
          break;
        }
        lastError = error as Error;
        if ((error as { status?: number }).status !== 403) break;
      }

      if (!session) throw lastError ?? new Error('인증 실패');

      await saveLastEmail(email!);
      setSession(session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showAlert('인증 실패', msg || '인증번호를 다시 확인해주세요.');
      setOtp('');
      inputRef.current?.focus();
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
      showAlert('재전송 완료', 'GLLO가 새 인증번호를 보냈어요.');
    } catch (err: unknown) {
      const isRateLimit = (err as { status?: number })?.status === 429;
      showAlert(
        '전송 실패',
        isRateLimit
          ? '이메일 전송 한도를 초과했어요.\n잠시 후 다시 시도해주세요.'
          : '다시 시도해주세요.',
      );
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={{ paddingHorizontal: spacing.screenPadding, paddingTop: 20 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8, marginLeft: -8 }}>
            <ArrowLeft size={24} color={colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, paddingHorizontal: spacing.screenPadding }}>
          <View style={{ paddingTop: 32, paddingBottom: 40 }}>
            <Text style={{ fontSize: 24, fontFamily: 'SUIT-Bold', color: colors.text.primary, marginBottom: 8 }}>
              인증번호 입력
            </Text>
            <Text style={{ fontSize: 15, color: colors.text.secondary, lineHeight: 22 }}>
              <Text style={{ fontFamily: 'Pretendard-SemiBold', color: colors.text.primary }}>{email}</Text>
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
                fontFamily: 'SUIT-Bold',
                letterSpacing: 12,
                color: colors.text.primary,
                textAlign: 'center',
                paddingVertical: 16,
                paddingHorizontal: 24,
                backgroundColor: colors.bg.input,
                borderRadius: radius.input,
                borderWidth: 2,
                borderColor: otp.length === 6 ? colors.accent.primary : colors.system.border,
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
                    <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: canResend ? colors.text.brand : colors.text.tertiary }}>
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
            accessibilityRole="button"
            style={{
              borderRadius: radius.button,
              paddingVertical: 16,
              alignItems: 'center',
              backgroundColor: otp.length === 6 && !isLoading ? colors.accent.primary : colors.bg.input,
            }}
          >
            {isLoading
              ? <ActivityIndicator color={colors.text.inverse} />
              : (
                <Text style={{
                  fontSize: 16,
                  fontFamily: 'Pretendard-SemiBold',
                  color: otp.length === 6 ? colors.text.inverse : colors.text.tertiary,
                }}>
                  확인
                </Text>
              )
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
