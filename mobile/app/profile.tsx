import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api/client';
import { colors, spacing, radius, shadow } from '@/theme';

interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  profileImageUrl: string | null;
  initialLetter: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => apiClient<UserProfile>('/user/profile'),
  });

  const { mutateAsync: updateName, isPending: savingName } = useMutation({
    mutationFn: (displayName: string) =>
      apiClient('/user/profile/name', {
        method: 'PUT',
        body: JSON.stringify({ displayName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setEditingName(false);
    },
  });

  const { mutateAsync: updateImage } = useMutation({
    mutationFn: (imageUrl: string) =>
      apiClient('/user/profile/image', {
        method: 'PUT',
        body: JSON.stringify({ imageUrl }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  const { mutateAsync: removeImage } = useMutation({
    mutationFn: () => apiClient('/user/profile/image', { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });

  async function handlePickImage() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 라이브러리 접근 권한이 필요해요.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return;

    const userId = session?.user?.id;
    if (!userId) return;

    setUploadingImage(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `${userId}/${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(path);

      await updateImage(publicUrl);
      Alert.alert('완료', '프로필 사진이 업데이트됐어요 ✓');
    } catch {
      Alert.alert('오류', '글로가 사진을 업로드하지 못했어요. 다시 시도해볼까요?');
    } finally {
      setUploadingImage(false);
    }
  }

  function handleRemoveImage() {
    Alert.alert('사진 제거', '프로필 사진을 제거할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '제거',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeImage();
          } catch {
            Alert.alert('오류', '사진 제거에 실패했어요.');
          }
        },
      },
    ]);
  }

  async function handleSaveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try {
      await updateName(trimmed);
    } catch {
      Alert.alert('오류', '닉네임 변경에 실패했어요.');
    }
  }

  const emailFromSession = session?.user?.email ?? '';
  const effectiveName = (profile?.displayName
    ?? (emailFromSession.includes('@') ? emailFromSession.split('@')[0] : emailFromSession))
    || '-';
  const effectiveEmail = (profile?.email ?? emailFromSession) || '-';
  const effectiveLetter = profile?.initialLetter
    ?? (emailFromSession ? emailFromSession[0].toUpperCase() : '?');

  function startEditName() {
    setNameInput(profile?.displayName ?? effectiveName);
    setEditingName(true);
  }

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.text.brand} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg.screen }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.screenPadding,
        paddingVertical: 16,
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
          <Text style={{ fontSize: 20, color: colors.text.primary }}>←</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text.primary }}>
          프로필 설정
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <TouchableOpacity onPress={handlePickImage} disabled={uploadingImage} activeOpacity={0.8}>
            <View style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.bg.surface,
              justifyContent: 'center',
              alignItems: 'center',
              overflow: 'hidden',
              ...shadow.card,
            }}>
              {uploadingImage ? (
                <ActivityIndicator color={colors.text.brand} />
              ) : profile?.profileImageUrl ? (
                <Image
                  source={{ uri: profile.profileImageUrl }}
                  style={{ width: 96, height: 96 }}
                />
              ) : (
                <Text style={{ fontSize: 36, fontWeight: '700', color: colors.text.brand }}>
                  {effectiveLetter}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <TouchableOpacity onPress={handlePickImage} style={{ marginTop: 12 }}>
            <Text style={{ fontSize: 14, color: colors.text.brand, fontWeight: '600' }}>
              사진 변경
            </Text>
          </TouchableOpacity>

          {profile?.profileImageUrl ? (
            <TouchableOpacity onPress={handleRemoveImage} style={{ marginTop: 6 }}>
              <Text style={{ fontSize: 13, color: colors.text.tertiary }}>사진 제거</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          overflow: 'hidden',
          marginBottom: 16,
          ...shadow.card,
        }}>
          <View style={{
            padding: spacing.cardPadding,
            borderBottomWidth: 1,
            borderBottomColor: colors.system.divider,
          }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 6 }}>
              닉네임
            </Text>
            {editingName ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  style={{
                    flex: 1,
                    fontSize: 16,
                    color: colors.text.primary,
                    backgroundColor: colors.bg.input,
                    borderRadius: radius.input,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                  placeholder="닉네임 입력"
                  autoFocus
                  maxLength={50}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={savingName}
                  style={{
                    backgroundColor: colors.text.brand,
                    borderRadius: radius.button,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                    {savingName ? '...' : '저장'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setEditingName(false)}>
                  <Text style={{ color: colors.text.tertiary, fontSize: 14 }}>취소</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={startEditName}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <Text style={{ fontSize: 16, color: colors.text.primary, fontWeight: '500' }}>
                  {effectiveName}
                </Text>
                <Text style={{ color: colors.text.brand, fontSize: 13, fontWeight: '500' }}>수정</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={{ padding: spacing.cardPadding }}>
            <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 6 }}>
              이메일
            </Text>
            <Text style={{ fontSize: 16, color: colors.text.secondary }}>
              {effectiveEmail}
            </Text>
          </View>
        </View>

        <View style={{
          marginHorizontal: spacing.screenPadding,
          backgroundColor: colors.bg.surface,
          borderRadius: radius.card,
          overflow: 'hidden',
        }}>
          <TouchableOpacity
            onPress={() => router.push('/delete-account')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: spacing.cardPadding,
            }}
          >
            <Text style={{ fontSize: 20, marginRight: 12 }}>⚠️</Text>
            <Text style={{ flex: 1, fontSize: 15, color: colors.loss.text }}>계정 탈퇴</Text>
            <Text style={{ color: colors.text.tertiary }}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={{
          textAlign: 'center',
          fontSize: 12,
          color: colors.text.tertiary,
          paddingTop: 24,
          paddingHorizontal: spacing.screenPadding,
        }}>
          글로가 소중한 정보를 안전하게 보관하고 있어요 💜
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
