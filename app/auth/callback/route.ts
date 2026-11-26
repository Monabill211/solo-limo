import { NextResponse, type NextRequest } from 'next/server';
import { createAuthClient } from '@/app/lib/auth-server';
import { safeReturnPath } from '@/app/lib/return-path';

export async function GET(request: NextRequest) {
  const redirect = (url: URL) => NextResponse.redirect(url, { headers: { 'Cache-Control': 'private, no-store' } });
  const code = request.nextUrl.searchParams.get('code');
  const next = safeReturnPath(request.nextUrl.searchParams.get('next'));
  let confirmationError: string | undefined;
  if (code) {
    const supabase = await createAuthClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirect(new URL(next, request.url));
    confirmationError = error.message;
  }
  const retry = new URL('/login', request.url);
  retry.searchParams.set('error', 'confirmation');
  retry.searchParams.set('next', next);
  const response = redirect(retry);
  response.cookies.set('solo-confirmation-error', confirmationError ?? '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:',
    path: '/login',
    maxAge: confirmationError ? 60 : 0,
  });
  return response;
}
