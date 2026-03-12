import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthState {
  session: Session | null;
  isLoading: boolean;
  pendingEmail: string | null;
  pendingPinSetup: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (isLoading: boolean) => void;
  setPendingPinSetup: (val: boolean) => void;
  sendOtp: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  pendingEmail: null,
  pendingPinSetup: false,

  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),
  setPendingPinSetup: (pendingPinSetup) => set({ pendingPinSetup }),

  sendOtp: async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
    set({ pendingEmail: email });
  },

  verifyOtp: async (email: string, token: string) => {
    const otpTypes = ['email', 'signup'] as const;
    let session = null;
    let lastError: Error | null = null;

    for (const type of otpTypes) {
      const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
      if (!error) {
        session = data.session;
        break;
      }
      lastError = error as Error;
      if ((error as { status?: number }).status !== 403) break;
    }

    if (!session) throw lastError ?? new Error('인증 실패');
    set({ session, pendingEmail: null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
