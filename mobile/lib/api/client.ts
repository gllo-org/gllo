import { supabase } from '@/lib/supabase';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1`;

export class ApiError extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const json = await response.json();

  if (!json.success) {
    throw new ApiError(json.code ?? response.status, json.message ?? '요청이 실패했습니다.');
  }

  return json.data as T;
}
