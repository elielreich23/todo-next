import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseAuthRedirectUrl = process.env.NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL;

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

export async function signInWithGoogle({ flow = 'signin' } = {}) {
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
