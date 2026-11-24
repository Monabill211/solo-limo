import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // مفيش مستخدم مسجّل
  if (!user) {
    return isLoginPage ? response : NextResponse.redirect(new URL('/admin/login', request.url));
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  // لو القراءة فشلت (خطأ مؤقت) ما نطردش المستخدم
  if (error) return response;

  const isAdmin = profile?.role === 'admin';

  if (isLoginPage) {
    return isAdmin ? NextResponse.redirect(new URL('/admin', request.url)) : response;
  }

  if (!isAdmin) {
    const url = new URL('/admin/login', request.url);
    url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};