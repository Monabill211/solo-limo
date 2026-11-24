import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { serviceClient } from '@/app/lib/admin-server';

// ⚠️ راجع ترتيب حقول الـ HMAC مع توثيق Paymob الحالي قبل الإطلاق
const FIELDS = [
  'amount_cents', 'created_at', 'currency', 'error_occured', 'has_parent_transaction',
  'id', 'integration_id', 'is_3d_secure', 'is_auth', 'is_capture', 'is_refunded',
  'is_standalone_payment', 'is_voided', 'order.id', 'owner', 'pending',
  'source_data.pan', 'source_data.sub_type', 'source_data.type', 'success',
];

const get = (o: any, path: string) => path.split('.').reduce((a, k) => a?.[k], o);

function validSignature(obj: any, received: string | null) {
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

  const admin = serviceClient();

  const { data: payment } = await admin
    .from('payments')
    .select('id, booking_id, amount, status')
    .eq('provider_order_id', String(obj.order?.id ?? ''))
    .maybeSingle();

  if (!payment) return NextResponse.json({ ok: true }); // مش بتاعنا
  if (payment.status === 'success') return NextResponse.json({ ok: true }); // اتعالج قبل كده
  if (obj.pending === true) return NextResponse.json({ ok: true });

  const paidAmount = Number(obj.amount_cents) / 100;
  const success = obj.success === true && Math.abs(paidAmount - Number(payment.amount)) < 0.01;

  await admin
    .from('payments')
    .update({
      status: success ? 'success' : 'failed',
      provider_txn_id: String(obj.id),
      raw: obj,
    })
    .eq('id', payment.id);

  if (success) {
    await admin.from('bookings').update({ status: 'paid' }).eq('id', payment.booking_id);
  }

  return NextResponse.json({ ok: true });
}