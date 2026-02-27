import { View, Text, TouchableOpacity } from 'react-native';
import { colors } from '@/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'done'] as const;
type Key = typeof KEYS[number];

interface Props {
  value: string;
  length?: number;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  error?: boolean;
}

export function PinPad({ value, length = 6, onChange, onSubmit, error }: Props) {
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

  const dotFill = error ? colors.loss.text : colors.text.brand;
  const dotBorder = error ? colors.loss.text : colors.system.border;
  const canSubmit = value.length === length;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 40 }}>
        {Array.from({ length }).map((_, i) => (
          <View
            key={i}
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: i < value.length ? dotFill : 'transparent',
              borderWidth: 2,
              borderColor: i < value.length ? dotFill : dotBorder,
            }}
          />
        ))}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 280, gap: 12 }}>
        {KEYS.map((key) => {
          const isDel = key === 'del';
          const isDone = key === 'done';
          return (
            <TouchableOpacity
              key={key}
              onPress={() => handleKey(key)}
              activeOpacity={0.65}
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: isDone
                  ? (canSubmit ? colors.text.brand : colors.system.border)
                  : isDel ? 'transparent' : colors.bg.surface,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDel ? (
                <Text style={{ fontSize: 20, color: colors.text.secondary }}>⌫</Text>
              ) : isDone ? (
                <Text style={{ fontSize: 20, color: canSubmit ? colors.text.inverse : colors.text.tertiary }}>✓</Text>
              ) : (
                <Text style={{ fontSize: 24, fontWeight: '600', color: colors.text.primary }}>
                  {key}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
