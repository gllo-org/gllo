import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, TextInput,
  Animated, Easing, Dimensions, Modal, ActivityIndicator,
} from 'react-native';
import { showAlert } from '@/lib/ui/alert';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { useTheme, spacing, radius, shadow } from '@/theme';
import { ArrowLeft, Plus } from 'lucide-react-native';

const { height: SCREEN_H } = Dimensions.get('window');
const SHEET_H = SCREEN_H * 0.55;

type CategoryType = 'EXPENSE' | 'INCOME';

interface Category {
  id: number;
  name: string;
  type: CategoryType;
  systemCategory: boolean;
  color: string;
  emoji: string;
}

const TYPE_LABELS: Record<CategoryType, string> = {
  EXPENSE: '지출',
  INCOME: '수입',
};

function CategoryFormSheet({ visible, editTarget, onClose }: {
  visible: boolean;
  editTarget: Category | null;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const translateY = useRef(new Animated.Value(SHEET_H)).current;
  const queryClient = useQueryClient();
  const isEdit = editTarget !== null;

  const [name, setName] = useState('');
  const [type, setType] = useState<CategoryType>('EXPENSE');

  useEffect(() => {
    if (visible) {
      if (editTarget) {
        setName(editTarget.name);
        setType(editTarget.type as CategoryType);
      } else {
        setName('');
        setType('EXPENSE');
      }
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

  const { mutateAsync: createCat, isPending: isCreating } = useMutation({
    mutationFn: (body: object) =>
      apiClient('/categories', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const { mutateAsync: updateCat, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, body }: { id: number; body: object }) =>
      apiClient(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  async function handleSave() {
    if (!name.trim()) { showAlert('', '카테고리 이름을 입력해주세요.'); return; }
    try {
      if (isEdit && editTarget) {
        await updateCat({ id: editTarget.id, body: { name: name.trim(), color: '#9CA3AF', emoji: null } });
      } else {
        await createCat({ name: name.trim(), type, color: '#9CA3AF', emoji: null });
      }
      closeSheet();
      showAlert('완료', isEdit ? '카테고리가 수정되었습니다.' : '카테고리가 추가되었습니다.');
    } catch {
      showAlert('오류', '저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  const isPending = isCreating || isUpdating;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: colors.bg.overlay }} activeOpacity={1} onPress={closeSheet} />
        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_H,
          backgroundColor: colors.bg.screen,
          borderTopLeftRadius: radius.bottom, borderTopRightRadius: radius.bottom,
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
              {isEdit ? '카테고리 수정' : '새 카테고리'}
            </Text>

            <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>이름</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="카테고리 이름"
              placeholderTextColor={colors.text.tertiary}
              returnKeyType="done"
              style={{
                fontSize: 16, color: colors.text.primary,
                backgroundColor: colors.bg.input, borderRadius: radius.input,
                padding: 14, marginBottom: 20,
              }}
            />

            {!isEdit && (
              <>
                <Text style={{ fontSize: 13, fontFamily: 'Pretendard-Medium', color: colors.text.secondary, marginBottom: 8 }}>유형</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
                  {(Object.keys(TYPE_LABELS) as CategoryType[]).map((t) => {
                    const active = type === t;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setType(t)}
                        style={{
                          flex: 1, paddingVertical: 10, borderRadius: radius.chip,
                          backgroundColor: active ? colors.bg.surface : 'transparent',
                          alignItems: 'center',
                          borderWidth: 1.5,
                          borderColor: active ? colors.text.brand : colors.system.border,
                        }}
                      >
                        <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: active ? colors.text.brand : colors.text.tertiary }}>
                          {TYPE_LABELS[t]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

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

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formVisible, setFormVisible] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient<Category[]>('/categories'),
  });

  const { mutateAsync: deleteCat } = useMutation({
    mutationFn: (id: number) => apiClient(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  function handleDelete(cat: Category) {
    showAlert('카테고리 삭제', `"${cat.name}"을(를) 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제', style: 'destructive',
        onPress: async () => {
          try {
            await deleteCat(cat.id);
            showAlert('완료', '카테고리가 삭제되었습니다.');
          } catch {
            showAlert('오류', '삭제에 실패했어요.');
          }
        },
      },
    ]);
  }

  const expenseCats = categories.filter((c) => c.type === 'EXPENSE');
  const incomeCats = categories.filter((c) => c.type === 'INCOME');

  function renderCategoryList(cats: Category[], label: string) {
    if (cats.length === 0) return null;
    return (
      <>
        <Text style={{ fontSize: 13, fontFamily: 'Pretendard-SemiBold', color: colors.text.tertiary, marginBottom: 8 }}>
          {label}
        </Text>
        <View style={{ backgroundColor: colors.bg.surface, borderRadius: radius.card, overflow: 'hidden', marginBottom: 20, ...shadow.card }}>
          {cats.map((cat, idx) => (
            <View key={cat.id} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 16, paddingVertical: 14,
              borderBottomWidth: idx < cats.length - 1 ? 1 : 0,
              borderBottomColor: colors.system.divider,
            }}>
              <Text style={{ flex: 1, fontSize: 15, color: colors.text.primary }}>{cat.name}</Text>
              {cat.systemCategory ? (
                <Text style={{ fontSize: 13, color: colors.text.tertiary }}>기본</Text>
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => { setEditTarget(cat); setFormVisible(true); }}
                    style={{ padding: 8 }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 14, color: colors.text.brand }}>수정</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDelete(cat)}
                    style={{ padding: 8 }}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Text style={{ fontSize: 14, color: colors.loss.text }}>삭제</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ))}
        </View>
      </>
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
          카테고리 관리
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.text.brand} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.screenPadding, paddingBottom: 48 }}>
          {renderCategoryList(expenseCats, '지출')}
          {renderCategoryList(incomeCats, '수입')}

          {categories.length === 0 && (
            <View style={{ alignItems: 'center', paddingVertical: 32, gap: 8 }}>
              <Text style={{ fontSize: 14, color: colors.text.secondary, textAlign: 'center' }}>
                아직 카테고리가 없어요.{'\n'}아래 버튼으로 추가해보세요.
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => { setEditTarget(null); setFormVisible(true); }}
            activeOpacity={0.85}
            accessibilityRole="button"
            style={{ backgroundColor: colors.accent.primary, borderRadius: radius.button, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
          >
            <Plus size={18} color={colors.text.inverse} strokeWidth={2.4} />
            <Text style={{ fontSize: 15, fontFamily: 'Pretendard-SemiBold', color: colors.text.inverse }}>카테고리 추가</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <CategoryFormSheet
        visible={formVisible}
        editTarget={editTarget}
        onClose={() => { setFormVisible(false); setEditTarget(null); }}
      />
    </SafeAreaView>
  );
}
