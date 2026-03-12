import { supabase } from '@/lib/supabase';

const API_BASE = `${process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080'}/api/v1`;

export class ApiError extends Error {
  constructor(public readonly code: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function doFetch<T>(endpoint: string, token: string | undefined, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (response.status === 401 || response.status === 403) {
    throw new ApiError(response.status, '인증이 만료되었습니다.');
  }

  const json = await response.json();

  if (!json.success) {
    throw new ApiError(json.code ?? response.status, json.message ?? '요청이 실패했습니다.');
  }

  return json.data as T;
}

export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();

  try {
    return await doFetch<T>(endpoint, session?.access_token, options);
  } catch (error) {
    if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (!refreshError && refreshed.session) {
        try {
          return await doFetch<T>(endpoint, refreshed.session.access_token, options);
        } catch {
          await supabase.auth.signOut();
        }
      } else {
        await supabase.auth.signOut();
      }
    }
    throw error;
  }
}
