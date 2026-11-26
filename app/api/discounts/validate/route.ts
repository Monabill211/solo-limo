import { NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth-server';
import { serviceClient } from '@/app/lib/admin-server';
import { discountProblem } from '@/app/lib/pricing';
import { getUsdRate } from '@/app/lib/settings';

// Quote preview. The booking transaction verifies the discount again.
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body?.code ?? '').trim().toUpperCase();
  if (!code) return NextResponse.json({ error: 'discount_invalid' }, { status: 400 });

  const { data: discount, error } = await serviceClient()
    .from('discount_codes')
    .select('type, value, active, expires_at, max_uses, used_count, customer_id')
    .eq('code', code)
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'booking_failed' }, { status: 503 });
  const problem = discountProblem(discount, user.id);
  if (problem || !discount) return NextResponse.json({ error: problem ?? 'discount_invalid' }, { status: 400 });

  try {
    return NextResponse.json({ ok: true, code, type: discount.type, value: Number(discount.value), rate: await getUsdRate() });
  } catch {
    return NextResponse.json({ error: 'booking_failed' }, { status: 503 });
  }
}
