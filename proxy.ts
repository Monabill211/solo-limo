import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getAdminAccess } from './app/lib/admin-access';

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/about') {
    const url = request.nextUrl.clone();
    url.pathname = '/About';
    return NextResponse.redirect(url, 308);
  }

  const isLoginPage = request.nextUrl.pathname === '/admin/login';
  const isPaymentReturn = request.nextUrl.pathname === '/booking/success';
  const hasPaymentReference =
    /^[a-zA-Z0-9_-]{1,80}$/.test(request.nextUrl.searchParams.get('booking') ?? '') ||
    /^\d{1,24}$/.test(request.nextUrl.searchParams.get('order') ?? '');
  if (isPaymentReturn && !hasPaymentReference) return NextResponse.next();
  const pendingCookies = new Map<string, { name: string; value: string; options: CookieOptions }>();
  const authHeaders = new Headers();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cookies = new Map(request.cookies.getAll().map(({ name, value }) => [name, value]));
          for (const { name, value, options } of pendingCookies.values()) {
            if (options.maxAge === 0) cookies.delete(name);
            else cookies.set(name, value);
          }
          return Array.from(cookies, ([name, value]) => ({ name, value }));
        },
        setAll: (list, headers) => {
          for (const [name, value] of Object.entries(headers)) authHeaders.set(name, value);
          for (const cookie of list) pendingCookies.set(cookie.name, cookie);
        },
      },
    }
  );

  function withSessionCookies(result: NextResponse, preserveSession = true) {
    if (preserveSession) {
      authHeaders.forEach((value, name) => result.headers.set(name, value));
      for (const { name, value, options } of pendingCookies.values()) {
        result.cookies.set(name, value, options);
      }
    }
    result.headers.set('Cache-Control', 'private, no-store');
    return result;
  }

  function forward(verified: boolean) {
    if (verified) {
      for (const { name, value, options } of pendingCookies.values()) {
        if (options.maxAge === 0) request.cookies.delete(name);
        else request.cookies.set(name, value);
      }
    }
    return withSessionCookies(NextResponse.next({ request }), verified);
  }

  function redirect(path: string, error?: string, verified = false) {
    const url = new URL(path, request.url);
    if (error) url.searchParams.set('error', error);
    return withSessionCookies(NextResponse.redirect(url), verified);
  }

  if (isPaymentReturn) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return forward(true);
    const path = request.nextUrl.pathname + request.nextUrl.search;
    return redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  const access = await getAdminAccess(supabase);
  const { status } = access;
  if (status === 'unavailable') {
    // A verified user can have refreshed cookies even when the profiles query fails.
    // When Auth itself is unavailable, discard any attempted session deletion.
    const preserveSession = access.source === 'profiles';
    if (isLoginPage) return forward(preserveSession);
    const unavailable = new NextResponse('تعذّر التحقق من جلسة لوحة التحكم مؤقتاً. حدّث الصفحة للمحاولة مرة تانية.', {
      status: 503,
      headers: { 'Cache-Control': 'private, no-store', 'Retry-After': '5', 'Content-Type': 'text/plain; charset=utf-8' },
    });
    return withSessionCookies(unavailable, preserveSession);
  }
  if (isLoginPage) return status === 'admin' ? redirect('/admin', undefined, true) : forward(status === 'forbidden');
  if (status === 'admin') return forward(true);
  if (status === 'forbidden') return redirect('/admin/login', 'forbidden', true);
  return redirect('/admin/login');
}

export const config = {
  matcher: ['/about', '/admin/:path*', '/booking/success'],
};
