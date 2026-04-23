import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

/**
 * Zero Trust Route Protection Middleware
 *
 * - Refreshes Supabase session on every request (cookie-based)
 * - Redirects unauthenticated users away from protected routes → /login
 * - Checks MFA assurance level (aal2) — redirects to /mfa/challenge if needed
 * - Redirects already-authenticated users away from /login → /dashboard
 */

const PROTECTED_ROUTES = ['/dashboard', '/risks', '/compliance', '/settings'];

export async function middleware(request) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always use getUser() — never getSession() — for secure server-side verification
  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));

  // ── Unauthenticated → redirect to /login ──
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Authenticated on protected route → check MFA assurance level ──
  if (isProtectedRoute && user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
      // User has MFA enrolled but hasn't completed the challenge this session
      return NextResponse.redirect(new URL('/mfa/challenge', request.url));
    }
  }

  // ── Already authenticated on /login → redirect to dashboard ──
  if (pathname === '/login' && user) {
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (aalData?.nextLevel === 'aal2' && aalData?.currentLevel === 'aal1') {
      return NextResponse.redirect(new URL('/mfa/challenge', request.url));
    }

    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/risks/:path*',
    '/compliance/:path*',
    '/settings/:path*',
    '/login',
    '/mfa/:path*',
  ],
};
