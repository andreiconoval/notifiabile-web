import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('[Middleware] Processing:', request.nextUrl.pathname);
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = request.cookies.getAll();
          console.log(
            '[Middleware] Cookies available:',
            cookies.map((c) => c.name),
          );
          return cookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        setAll(cookiesToSet) {
          console.log(
            '[Middleware] Setting response cookies:',
            cookiesToSet.map((c) => c.name),
          );
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as any);
          });
        },
      },
    },
  );

  // Refresh session to ensure it's up to date
  const { data: authData, error: authError } = await supabase.auth.getUser();
  console.log('[Middleware] Session refresh result:', {
    hasUser: !!authData?.user,
    error: authError?.message,
  });

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
