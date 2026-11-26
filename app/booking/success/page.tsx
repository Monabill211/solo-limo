import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/app/lib/auth-server';
import { serviceClient } from '@/app/lib/admin-server';

type Status = 'paid' | 'pending' | 'failed' | 'unknown';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string; order?: string }>;
}) {
  const { booking, order } = await searchParams;
  const bookingId = typeof booking === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(booking) ? booking : null;
  const orderId = typeof order === 'string' && /^\d{1,24}$/.test(order) ? order : null;
  if (!bookingId && !orderId) return <Result status="unknown" />;

  const auth = await createAuthClient({ writable: false });
  const { data: { user } } = await auth.auth.getUser();
  const params = new URLSearchParams(bookingId ? { booking: bookingId } : { order: orderId! });
  const statusPath = `/booking/success?${params}`;
  if (!user) redirect(`/login?next=${encodeURIComponent(statusPath)}`);

  const supabase = serviceClient();
  let id = bookingId;
  if (!id && orderId) {
    const { data } = await supabase.from('payments').select('booking_id').eq('provider', 'paymob').eq('provider_order_id', orderId).maybeSingle();
    id = data?.booking_id ?? null;
  }
  if (!id) return <Result status="unknown" />;

  const { data: record } = await supabase.from('bookings').select('status, payments(status)')
    .eq('id', id).eq('user_id', user.id).maybeSingle();
  if (!record) return <Result status="unknown" />;

  const payments = Array.isArray(record.payments) ? record.payments : [record.payments];
  const status = record.status === 'paid' ? 'paid' :
    record.status === 'cancelled' || (payments.length > 0 && payments.every((payment) => payment?.status === 'failed')) ? 'failed' : 'pending';
  return <Result status={status} statusPath={statusPath} />;
}

function Result({ status, statusPath }: { status: Status; statusPath?: string }) {
  const t = useTranslations('Booking');
  const ok = status === 'paid';
  const label = status === 'paid' ? 'success' : status === 'failed' ? 'fail' : status === 'pending' ? 'pendingPayment' : 'unknownPayment';

  return (
    <div
      className="flex items-center justify-center"
      style={{ padding: '4rem 1rem', minHeight: '60vh' }}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-line bg-navy-light text-center shadow-2xl shadow-black/40"
        style={{ padding: '3rem 1.75rem' }}
      >
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
            ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-gold/15 text-gold-light'
          }`}
          style={{ marginBlockEnd: '1.25rem' }}
        >
          {ok ? '✓' : status === 'failed' ? '✕' : '…'}
        </span>

        <h1 className="text-2xl font-extrabold text-white" style={{ marginBlockEnd: '0.7rem' }}>
          {t(`${label}Title`)}
        </h1>
        <p className="leading-8 text-muted" style={{ marginBlockEnd: '1.75rem' }}>
          {t(`${label}Text`)}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            style={{ padding: '0.7rem 1.8rem' }}
            className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
          >
            {t('backHome')}
          </Link>
          {status === 'pending' && statusPath && (
            <a href={statusPath} className="rounded-xl border border-gold px-7 py-3 font-bold text-gold">{t('refreshPayment')}</a>
          )}
          {status === 'failed' && (
            <Link
              href="/cars"
              style={{ padding: '0.7rem 1.8rem' }}
              className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
            >
              {t('tryAgain')}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}