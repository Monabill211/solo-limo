import { NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth-server';
import { serviceClient } from '@/app/lib/admin-server';
import { discountProblem } from '@/app/lib/pricing';

// للمعاينة بس: الحساب النهائي بيتعمل تاني في /api/bookings
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.code ?? '').trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'discount_invalid' }, { status: 400 });

  const { data: d } = await serviceClient()
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle();

  const problem = discountProblem(d, user.id);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  return NextResponse.json({
    ok: true,
    code,
    type: d.type,
    value: Number(d.value),
    rate: Number(process.env.USD_EGP_RATE || 50),
  });
}