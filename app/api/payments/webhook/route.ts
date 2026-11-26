import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { serviceClient } from '@/app/lib/admin-server';

const FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

function get(value: unknown, path: string) {
  return path.split('.').reduce<unknown>((current, key) =>
    current && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined, value);
}

function validSignature(obj: unknown, received: string | null) {
  const secret = process.env.PAYMOB_HMAC_SECRET;
  if (!secret || !received) return false;

  const text = FIELDS.map((f) => String(get(obj, f) ?? '')).join('');
  const expected = createHmac('sha512', secret).update(text).digest('hex');

  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const obj = body?.obj;
  if (!obj) return NextResponse.json({ ok: false }, { status: 400 });

  const hmac = new URL(req.url).searchParams.get('hmac');
  if (!validSignature(obj, hmac)) return NextResponse.json({ ok: false }, { status: 401 });

  const orderId = String(obj.order?.id ?? '');
  const transactionId = String(obj.id ?? '');
  if (obj.pending === true || !orderId) return NextResponse.json({ ok: true });
  const amount = Number(obj.amount_cents);
  if (!transactionId || !Number.isSafeInteger(amount) || amount < 0 || typeof obj.currency !== 'string') {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const { error } = await serviceClient().rpc('apply_paymob_result', {
    p_order_id: orderId,
    p_transaction_id: transactionId,
    p_currency: obj.currency,
    p_amount_cents: amount,
    p_success: obj.success === true && !obj.is_refunded && !obj.is_voided && !(obj.is_auth && !obj.is_capture),
    p_payload: obj,
  });
  if (error) {
    if (error.message === 'payment_amount_or_currency_mismatch') return NextResponse.json({ ok: false }, { status: 422 });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}