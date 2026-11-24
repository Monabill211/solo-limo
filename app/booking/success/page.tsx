import Link from 'next/link';
import { useTranslations } from 'next-intl';

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const { success } = await searchParams;
  return <Result ok={success === 'true'} />;
}

function Result({ ok }: { ok: boolean }) {
  const t = useTranslations('Booking');

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
            ok ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
          }`}
          style={{ marginBlockEnd: '1.25rem' }}
        >
          {ok ? '✓' : '✕'}
        </span>

        <h1 className="text-2xl font-extrabold text-white" style={{ marginBlockEnd: '0.7rem' }}>
          {ok ? t('successTitle') : t('failTitle')}
        </h1>
        <p className="leading-8 text-muted" style={{ marginBlockEnd: '1.75rem' }}>
          {ok ? t('successText') : t('failText')}
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            style={{ padding: '0.7rem 1.8rem' }}
            className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
          >
            {t('backHome')}
          </Link>
          {!ok && (
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