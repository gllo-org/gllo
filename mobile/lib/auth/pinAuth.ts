import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const MAX_PIN_FAILURES = 5;

const LAST_EMAIL_KEY = 'gllo_last_email';
const pinRegKey = (uid: string) => `gllo_pin_reg_${uid}`;
const FAILURES_KEY = 'gllo_pin_failures';

async function get(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return window.localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function set(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') { window.localStorage.setItem(key, value); return; }
  return SecureStore.setItemAsync(key, value);
}

async function del(key: string): Promise<void> {
  if (Platform.OS === 'web') { window.localStorage.removeItem(key); return; }
  return SecureStore.deleteItemAsync(key);
}

export const getLastEmail = () => get(LAST_EMAIL_KEY);
export const saveLastEmail = (email: string) => set(LAST_EMAIL_KEY, email);
export const clearLastEmail = () => del(LAST_EMAIL_KEY);

export const isPinRegistered = async (userId: string) =>
  (await get(pinRegKey(userId))) === 'true';

export const markPinRegistered = (userId: string) =>
  set(pinRegKey(userId), 'true');

export const getPinFailures = async () => {
  const val = await get(FAILURES_KEY);
  return val ? parseInt(val, 10) : 0;
};

export const incrementPinFailures = async () => {
  const next = (await getPinFailures()) + 1;
  await set(FAILURES_KEY, String(next));
  return next;
};

export const resetPinFailures = () => del(FAILURES_KEY);

export const toPinPassword = (pin: string): string => `${pin}_GLLO_${pin}`;
