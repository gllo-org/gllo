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
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    if (error) throw error;
    set({ session: data.session, pendingEmail: null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null });
  },
}));
