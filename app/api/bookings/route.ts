import { NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth-server';
import { serviceClient } from '@/app/lib/admin-server';
import { computeTotals, discountProblem, type Currency } from '@/app/lib/pricing';
import { diffDays, isISO, todayISO } from '@/app/lib/dates';
import { createCheckout, paymobEnabled } from '@/app/lib/paymob';

const UUID = /^[0-9a-f-]{36}$/i;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return fail('unauthorized', 401);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return fail('bad_request');
  }

  const type = body.type === 'car' || body.type === 'apartment' ? body.type : null;
  const currency: Currency | null =
    body.currency === 'EGP' || body.currency === 'USD' ? body.currency : null;

  if (!type || !currency || typeof body.itemId !== 'string' || !UUID.test(body.itemId))
    return fail('bad_request');
  if (!isISO(body.start) || !isISO(body.end)) return fail('bad_dates');

  const name = String(body.name ?? '').trim().slice(0, 120);
  const phone = String(body.phone ?? '').trim().slice(0, 30);
  const notes = String(body.notes ?? '').trim().slice(0, 500);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 8) return fail('bad_contact');

  const days = diffDays(body.start, body.end);
  if (days < 1 || days > 90) return fail('bad_dates');
  if (body.start < todayISO()) return fail('past_date');

  const extraIds: string[] = Array.from(
    new Set(
      (Array.isArray(body.extraIds) ? body.extraIds : []).filter(
        (x: unknown) => typeof x === 'string' && UUID.test(x)
      ) as string[]
    )
  );

  const admin = serviceClient();

  // ---------- العنصر (السعر بيتقرا من الداتابيز مش من المتصفح) ----------
  const { data: item } = await admin
    .from(type === 'car' ? 'cars' : 'apartments')
    .select('id, name_ar, price_egp, price_usd, active')
    .eq('id', body.itemId)
    .maybeSingle();

  if (!item || !item.active) return fail('not_found', 404);

  // ---------- الإضافات ----------
  let extras: any[] = [];
  if (extraIds.length) {
    const { data } = await admin
      .from('extras')
      .select('id, name_ar, price_egp, price_usd, per_day, applies_to')
      .in('id', extraIds)
      .eq('active', true);

    extras = (data ?? []).filter((e) => !e.applies_to || e.applies_to === type);
    if (extras.length !== extraIds.length) return fail('bad_extras');
  }

  // ---------- التكاليف (للماليات) ----------
  const itemCost = await admin
    .from('costs')
    .select('cost_egp')
    .eq(type === 'car' ? 'car_id' : 'apartment_id', item.id)
    .maybeSingle();
  const unitCost = Number(itemCost.data?.cost_egp ?? 0);

  const extraCostMap = new Map<string, number>();
  if (extras.length) {
    const { data } = await admin
      .from('costs')
      .select('extra_id, cost_egp')
      .in('extra_id', extras.map((e) => e.id));
    (data ?? []).forEach((c) => extraCostMap.set(c.extra_id, Number(c.cost_egp)));
  }

  // ---------- كود الخصم ----------
  let discount: { id: string; type: 'percent' | 'fixed'; value: number } | null = null;
  const code = String(body.code ?? '').trim().toUpperCase();
  if (code) {
    const { data: d } = await admin.from('discount_codes').select('*').eq('code', code).maybeSingle();
    const problem = discountProblem(d, user.id);
    if (problem) return fail(problem);
    discount = { id: d.id, type: d.type, value: Number(d.value) };
  }

  // ---------- الحساب ----------
  const rate = Number(process.env.USD_EGP_RATE || 50);
  const unit = Number(currency === 'EGP' ? item.price_egp : item.price_usd);
  const price = (e: any) => Number(currency === 'EGP' ? e.price_egp : e.price_usd);

  const totals = computeTotals({
    unit,
    days,
    currency,
    rate,
    extras: extras.map((e) => ({ price: price(e), perDay: e.per_day })),
    discount,
  });

  // ---------- إنشاء الحجز ----------
  const { data: booking, error: bookingError } = await admin
    .from('bookings')
    .insert({
      user_id: user.id,
      booking_type: type,
      car_id: type === 'car' ? item.id : null,
      apartment_id: type === 'apartment' ? item.id : null,
      start_date: body.start,
      end_date: body.end,
      customer_name: name,
      customer_phone: phone,
      notes: notes || null,
      currency,
      exchange_rate: currency === 'USD' ? rate : 1,
      unit_price: unit,
      extras_total: totals.extrasTotal,
      discount_code_id: discount?.id ?? null,
      discount_amount: totals.discountAmount,
      total: totals.total,
    })
    .select('id')
    .single();

  if (bookingError || !booking) {
    // 23P01 = التواريخ متداخلة مع حجز تاني
    return bookingError?.code === '23P01' ? fail('dates_taken', 409) : fail('booking_failed', 500);
  }

  // ---------- تفاصيل الحجز ----------
  const extrasCost = extras.reduce(
    (s, e) => s + (extraCostMap.get(e.id) ?? 0) * (e.per_day ? days : 1),
    0
  );

  const [extrasRes, financeRes] = await Promise.all([
    extras.length
      ? admin.from('booking_extras').insert(
          extras.map((e) => ({ booking_id: booking.id, extra_id: e.id, quantity: 1, unit_price: price(e) }))
        )
      : Promise.resolve({ error: null }),
    admin.from('booking_finance').insert({
      booking_id: booking.id,
      unit_cost_egp: unitCost,
      extras_cost_egp: extrasCost,
      total_cost_egp: unitCost * days + extrasCost,
    }),
  ]);

  if (extrasRes.error || financeRes.error) {
    await admin.from('bookings').delete().eq('id', booking.id);
    return fail('booking_failed', 500);
  }

  // ---------- مجاني بالكامل (خصم 100%) ----------
  if (totals.total <= 0) {
    await admin.from('bookings').update({ status: 'paid' }).eq('id', booking.id);
    return NextResponse.json({ bookingId: booking.id, total: 0, currency, paid: true });
  }

  // ---------- الدفع ----------
  let checkoutUrl: string | null = null;
  let paymentError = false;

  if (paymobEnabled()) {
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
      const checkout = await createCheckout({
        bookingId: booking.id,
        amount: totals.total,
        currency,
        name,
        phone,
        email: user.email ?? 'customer@sololimo.com',
        itemName: item.name_ar,
        origin,
      });

      await admin.from('payments').insert({
        booking_id: booking.id,
        provider: 'paymob',
        provider_order_id: checkout.orderId,
        amount: totals.total,
        currency,
        status: 'pending',
      });

      checkoutUrl = checkout.url;
    } catch {
      paymentError = true;
    }
  }

  return NextResponse.json({
    bookingId: booking.id,
    total: totals.total,
    currency,
    checkoutUrl,
    paymentError,
  });
}