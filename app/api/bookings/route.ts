import { NextResponse } from 'next/server';
import { getAuthUser } from '@/app/lib/auth-server';
import { serviceClient } from '@/app/lib/admin-server';
import type { Currency } from '@/app/lib/pricing';
import { addDays, diffDays, isISO, todayISO } from '@/app/lib/dates';
import { createCheckout, paymobEnabled } from '@/app/lib/paymob';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

const bookingErrors = new Set([
  'bad_dates', 'past_date', 'bad_contact', 'bad_flight', 'bad_time', 'bad_passengers',
  'bad_extras', 'discount_invalid', 'discount_inactive', 'discount_expired', 'discount_not_yours', 'discount_used_up',
]);
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) return fail('unauthorized', 401);

  let body: Record<string, unknown>;
  try {
    const value: unknown = await req.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('bad_request');
    body = value as Record<string, unknown>;
  } catch {
    return fail('bad_request');
  }

  const type: 'car' | 'apartment' | 'airport' | null =
    body.type === 'car' || body.type === 'apartment' || body.type === 'airport' ? body.type : null;
  const currency: Currency | null =
    body.currency === 'EGP' || body.currency === 'USD' ? body.currency : null;

  if (!type || !currency || typeof body.itemId !== 'string' || !UUID.test(body.itemId))
    return fail('bad_request');
  if (!isISO(body.start)) return fail('bad_dates');

  const name = String(body.name ?? '').trim().slice(0, 120);
  const phone = String(body.phone ?? '').trim().slice(0, 30);
  const notes = String(body.notes ?? '').trim().slice(0, 500);
  if (name.length < 2 || phone.replace(/\D/g, '').length < 8) return fail('bad_contact');

  const isAirport = type === 'airport';
  let endDate: string;
  let days: number;
  let flight: string | null = null;
  let time: string | null = null;
  let passengers: number | null = null;

  if (isAirport) {
    // خدمة المطار: يوم واحد، والتاريخ هو يوم الخدمة
    endDate = addDays(body.start, 1);
    days = 1;

    flight = String(body.flight ?? '').trim().slice(0, 20);
    time = String(body.time ?? '').trim();
    passengers = Number(body.passengers);

    if (flight.length < 2) return fail('bad_flight');
    if (!TIME.test(time)) return fail('bad_time');
    if (!Number.isInteger(passengers) || passengers < 1 || passengers > 20) return fail('bad_passengers');
  } else {
    if (!isISO(body.end)) return fail('bad_dates');
    endDate = body.end;
    days = diffDays(body.start, body.end);
    if (days < 1 || days > 90) return fail('bad_dates');
  }

  if (body.start < todayISO()) return fail('past_date');

  const rawExtras = body.extraIds ?? [];
  if (!Array.isArray(rawExtras) || rawExtras.length > 50 ||
      !rawExtras.every((id): id is string => typeof id === 'string' && UUID.test(id))) return fail('bad_extras');
  const extraIds = Array.from(new Set(rawExtras.map((id) => id.toLowerCase())));
  const admin = serviceClient();
  const { data: booking, error: bookingError } = await admin.rpc('create_booking', {
    p_user_id: user.id,
    p_type: type,
    p_item_id: body.itemId,
    p_currency: currency,
    p_start: body.start,
    p_end: endDate,
    p_name: name,
    p_phone: phone,
    p_notes: notes,
    p_flight: flight,
    p_time: time,
    p_passengers: passengers,
    p_extras: extraIds,
    p_code: String(body.code ?? ''),
  }).single<{ booking_id: string; total: number; item_name: string; paid: boolean }>();

  if (bookingError || !booking) {
    if (bookingError?.code === '23P01') return fail('dates_taken', 409);
    if (bookingError?.message === 'not_found') return fail('not_found', 404);
    if (bookingError?.code === 'P0001' && bookingErrors.has(bookingError.message)) return fail(bookingError.message);
    console.error('Booking transaction failed', bookingError?.code, bookingError?.message);
    return fail('booking_failed', 500);
  }

  if (booking.paid) return NextResponse.json({ bookingId: booking.booking_id, total: 0, currency, paid: true });

  // ---------- الدفع ----------
  let checkoutUrl: string | null = null;
  let paymentError = false;

  if (paymobEnabled()) {
    try {
      const origin = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
      const checkout = await createCheckout({
        bookingId: booking.booking_id,
        amount: booking.total,
        currency,
        name,
        phone,
        email: user.email ?? 'customer@sololimo.com',
        itemName: booking.item_name,
        origin,
      });

      const { error: paymentInsertError } = await admin.from('payments').insert({
        booking_id: booking.booking_id,
        provider: 'paymob',
        provider_order_id: checkout.orderId,
        amount: booking.total,
        currency,
        status: 'pending',
      });

      if (paymentInsertError) throw paymentInsertError;
      checkoutUrl = checkout.url;
    } catch {
      paymentError = true;
    }
  }

  return NextResponse.json({
    bookingId: booking.booking_id,
    total: booking.total,
    currency,
    checkoutUrl,
    paymentError,
  });
}