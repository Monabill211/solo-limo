import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// أي صفحة تحت /admin ما تفتحش غير للأدمن، وغير كده بيتحوّل لصفحة الدخول
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

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    isAdmin = profile?.role === 'admin';
  }

  if (isLoginPage) {
    // الأدمن المسجّل مالوش لازمة يشوف صفحة الدخول
    if (isAdmin) return NextResponse.redirect(new URL('/admin', request.url));
    return response;
  }

  if (!isAdmin) {
    const url = new URL('/admin/login', request.url);
    if (user) url.searchParams.set('error', 'forbidden');
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};