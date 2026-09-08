import { Alert, Platform } from 'react-native';

type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

type AlertButton = {
  text?: string;
  onPress?: () => void;
  style?: AlertButtonStyle;
};

export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const list = buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }];
  const text = [title, message].filter(Boolean).join('\n\n');

  if (list.length <= 1) {
    window.alert(text);
    list[0]?.onPress?.();
    return;
  }

  const cancelButton = list.find((b) => b.style === 'cancel');
  const confirmButton = list.find((b) => b !== cancelButton) ?? list[list.length - 1];

  if (window.confirm(text)) {
    confirmButton?.onPress?.();
  } else {
    cancelButton?.onPress?.();
  }
}
