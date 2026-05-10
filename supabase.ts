import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON } from './lib/constants';

// Clerk token getter — _layout.tsx'te set edilir, her Supabase isteğinde çağrılır (token her zaman taze)
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: (() => Promise<string | null>) | null) { _getToken = fn; }

export async function getAuthToken(): Promise<string> {
  if (_getToken) {
    const token = await _getToken();
    if (token) return token;
  }
  return SUPABASE_ANON;
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  global: {
    fetch: async (url, options = {}) => {
      const headers = new Headers(options.headers as HeadersInit);
      if (_getToken) {
        const token = await _getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);
      }
      return fetch(url, { ...options, headers });
    },
  },
  auth: {
    persistSession:     false,
    autoRefreshToken:   false,
    detectSessionInUrl: false,
  },
});
