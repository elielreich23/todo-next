import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAuthRedirectUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL;
const missingSupabaseConfigMessage =
  'Google sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      }
    )
  : null;

export async function signInWithGoogle({ flow = 'signin' } = {}) {
  if (!supabase) {
    return {
      data: null,
      error: new Error(missingSupabaseConfigMessage),
    };
  }

  const callbackUrl =
    supabaseAuthRedirectUrl || (typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : undefined);
  const redirectTo = callbackUrl
    ? `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}flow=${encodeURIComponent(flow)}`
    : undefined;

  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });
}
