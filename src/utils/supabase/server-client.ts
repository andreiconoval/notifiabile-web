import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

function getSupabaseEnv(key: 'url' | 'anonKey') {
  const value =
    key === 'url'
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value) {
    throw new Error('Supabase environment variables are not configured.');
  }
  return value;
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const supabaseUrl = getSupabaseEnv('url');
  const supabaseKey = getSupabaseEnv('anonKey');

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      async getAll() {
        const store = await cookieStore;
        const allCookies = store.getAll();
        const sbAuthToken = allCookies.find((c) => c.name === 'sb-auth-token');
        const sbRefreshToken = allCookies.find((c) => c.name === 'sb-refresh-token');

        console.log('[createSupabaseServerClient] Cookies found:', {
          sbAuthToken: !!sbAuthToken,
          sbRefreshToken: !!sbRefreshToken,
          totalCookies: allCookies.length,
        });

        // If we have custom session cookies, return them for Supabase to use
        if (sbAuthToken) {
          const supabaseCookies = [sbAuthToken];
          if (sbRefreshToken) {
            supabaseCookies.push(sbRefreshToken);
          }
          console.log('[createSupabaseServerClient] Using custom auth cookies');
          return supabaseCookies;
        }

        return allCookies;
      },
      async setAll(cookiesToSet) {
        const store = await cookieStore;
        console.log(
          '[createSupabaseServerClient] Setting cookies:',
          cookiesToSet.map((c) => c.name),
        );
        cookiesToSet.forEach((cookie) => {
          store.set(cookie);
        });
      },
    },
  });
}
