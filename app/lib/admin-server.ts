import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// بيتأكد إن اللي بيبعت الطلب أدمن مسجّل دخول
export async function isAdminRequest() {
  const store = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: { getAll: () => store.getAll(), setAll: () => {} },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return profile?.role === 'admin';
}

// عميل بصلاحيات كاملة، للسيرفر بس (مفتاح service role عمره ما يروح للمتصفح)
export function serviceClient() {
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}