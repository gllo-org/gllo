import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/stores/authStore';
import { colors, radius, spacing } from '@/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { sendOtp } = useAuthStore();
  const router = useRouter();

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

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
