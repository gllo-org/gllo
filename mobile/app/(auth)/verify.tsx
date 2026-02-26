import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

const OTP_EXPIRE_SECONDS = 300;

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(OTP_EXPIRE_SECONDS);
  const inputRef = useRef<TextInput>(null);
  const { verifyOtp, sendOtp } = useAuthStore();
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
    if (otp.length !== 6) return;
    setIsLoading(true);
    try {
      await verifyOtp(email!, otp);
    } catch {
      Alert.alert('인증 실패', '인증번호를 다시 확인해주세요.');
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
      Alert.alert('재전송 완료', '글로가 새 인증번호를 보냈어요.');
    } catch {
      Alert.alert('오류', '다시 시도해주세요.');
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
              {secondsLeft <= OTP_EXPIRE_SECONDS - 60 && (
                <TouchableOpacity onPress={handleResend} style={{
                  paddingHorizontal: 12, paddingVertical: 5,
                  borderRadius: 20,
                  backgroundColor: colors.bg.surface,
                  borderWidth: 1,
                  borderColor: colors.text.brand,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.brand }}>
                    재전송
                  </Text>
                </TouchableOpacity>
              )}
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
