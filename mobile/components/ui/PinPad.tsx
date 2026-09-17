import { View, Text, Pressable } from 'react-native';
import { useTheme, radius, spacing } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'done'] as const;
type Key = typeof KEYS[number];

const PAD_WIDTH = 276;
const KEY_SIZE = 84;

interface Props {
  value: string;
  length?: number;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  error?: boolean;
}

export function PinPad({ value, length = 4, onChange, onSubmit, error }: Props) {
  const { colors } = useTheme();

  function handleKey(key: Key) {
    if (key === 'del') {
      onChange(value.slice(0, -1));
    } else if (key === 'done') {
      if (value.length === length) onSubmit?.();
    } else {
      if (value.length >= length) return;
      const next = value + key;
      onChange(next);
      if (next.length === length) {
        setTimeout(() => onSubmit?.(), 120);
      }
    }
  }

  const dotFill = error ? colors.loss.text : colors.accent.primary;
  const dotBorder = error ? colors.loss.text : colors.system.border;
  const canSubmit = value.length === length;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 14,
        marginBottom: 36,
      }}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          return (
            <View
              key={i}
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: filled ? dotFill : 'transparent',
                borderWidth: 1.5,
                borderColor: filled ? dotFill : dotBorder,
              }}
            />
          );
        })}
      </View>

      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: PAD_WIDTH,
        gap: spacing.sectionGap,
      }}>
        {KEYS.map((key) => {
          const isDel = key === 'del';
          const isDone = key === 'done';
          return (
            <Pressable
              key={key}
              onPress={() => handleKey(key)}
              accessibilityRole="button"
              accessibilityLabel={isDel ? '지우기' : isDone ? '확인' : key}
              style={({ pressed }) => ({
                width: KEY_SIZE,
                height: KEY_SIZE,
                borderRadius: radius.button,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: isDel ? 0 : 1,
                borderColor: isDone && canSubmit ? colors.accent.primary : colors.system.border,
                backgroundColor: isDone
                  ? (canSubmit ? colors.accent.primary : colors.bg.input)
                  : isDel
                    ? (pressed ? colors.bg.input : 'transparent')
                    : colors.bg.surface,
                opacity: pressed ? (isDel ? 1 : 0.72) : 1,
              })}
            >
              {isDel ? (
                <Text style={{ fontSize: 20, color: colors.text.secondary }}>⌫</Text>
              ) : isDone ? (
                <Text style={{
                  fontSize: 20,
                  color: canSubmit ? colors.text.inverse : colors.text.tertiary,
                }}>
                  ✓
                </Text>
              ) : (
                <Text style={{
                  fontFamily: 'SUIT-SemiBold',
                  fontSize: 24,
                  color: colors.text.primary,
                }}>
                  {key}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
