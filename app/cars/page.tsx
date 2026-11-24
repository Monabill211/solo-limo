'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '../lib/supabase/client';
import { useCurrency } from '../providers/CurrencyProvider';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Car = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  seats: number | null;
  images: string[] | null;
  price_egp: number;
  price_usd: number;
};

type SeatsFilter = 'all' | 'small' | 'mid' | 'large';
type Sort = 'newest' | 'priceLow' | 'priceHigh';

const SEATS: SeatsFilter[] = ['all', 'small', 'mid', 'large'];

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

const ic = (path: React.ReactNode, size = 'h-5 w-5') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
  >
    {path}
  </svg>
);

const carIcon = (size: string) =>
  ic(
    <>
      <path d="M3 15l1.6-5.2A2 2 0 0 1 6.5 8.4h11a2 2 0 0 1 1.9 1.4L21 15" />
      <rect x="3" y="15" width="18" height="4" rx="1" />
      <circle cx="7" cy="17" r="0.6" />
      <circle cx="17" cy="17" r="0.6" />
    </>,
    size
  );

const HIGHLIGHTS = [
  {
    key: 'hl1',
    svg: ic(
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>,
      'h-6 w-6'
    ),
  },
  {
    key: 'hl2',
    svg: ic(
      <>
        <path d="M21 3L3 10.5l6.5 2.5L12 21l9-18z" />
        <path d="M9.5 13L21 3" />
      </>,
      'h-6 w-6'
    ),
  },
  {
    key: 'hl3',
    svg: ic(
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </>,
      'h-6 w-6'
    ),
  },
  {
    key: 'hl4',
    svg: ic(<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />, 'h-6 w-6'),
  },
] as const;

export default function CarsPage() {
  const t = useTranslations('CarsPage');
  const locale = useLocale();
  const { currency } = useCurrency();
  const isAr = locale === 'ar';

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [query, setQuery] = useState('');
  const [seats, setSeats] = useState<SeatsFilter>('all');
  const [sort, setSort] = useState<Sort>('newest');

  useEffect(() => {
    let alive = true;

    createClient()
      .from('cars')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setFailed(true);
        } else {
          setCars(
            (data ?? []).map((c: any) => ({
              ...c,
              price_egp: Number(c.price_egp),
              price_usd: Number(c.price_usd),
              images: c.images ?? [],
            }))
          );
        }
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const price = (c: Car) => {
    const value = currency === 'EGP' ? c.price_egp : c.price_usd;
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = cars.filter((c) => {
      if (seats !== 'all') {
        if (c.seats === null) return false;
        if (seats === 'small' && c.seats > 4) return false;
        if (seats === 'mid' && (c.seats < 5 || c.seats > 7)) return false;
        if (seats === 'large' && c.seats < 8) return false;
      }
      if (!q) return true;
      return `${c.name_ar} ${c.name_en} ${c.brand ?? ''} ${c.model ?? ''}`.toLowerCase().includes(q);
    });

    const key = (c: Car) => (currency === 'EGP' ? c.price_egp : c.price_usd);
    if (sort === 'priceLow') return [...filtered].sort((a, b) => key(a) - key(b));
    if (sort === 'priceHigh') return [...filtered].sort((a, b) => key(b) - key(a));
    return filtered;
  }, [cars, query, seats, sort, currency]);

  const hasFilters = query.trim() !== '' || seats !== 'all' || sort !== 'newest';

  function reset() {
    setQuery('');
    setSeats('all');
    setSort('newest');
  }

  return (
    <div>
      {/* ---------- الهيدر ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '4.5rem 4rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 end-1/4 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div
          className="w-full max-w-3xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span className={badgeClass} style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}>
            {t('badge')}
          </span>

          <h1
            className="text-4xl font-extrabold leading-tight text-white md:text-5xl md:leading-tight"
            style={{ marginBlockEnd: '1rem' }}
          >
            {t.rich('title', {
              g: (chunks) => (
                <span className="bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p className="text-lg leading-9 text-white/75">{t('intro')}</p>
        </div>
      </section>

      {/* ---------- المميزات ---------- */}
      <section style={{ paddingBlock: '2.5rem 0' }}>
        <div
          className="grid w-full max-w-6xl grid-cols-2 gap-3 md:grid-cols-4"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.key}
              className="flex items-center gap-3 rounded-2xl border border-line bg-navy-light"
              style={{ padding: '0.9rem 1rem' }}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                {h.svg}
              </span>
              <span className="text-sm font-bold leading-6 text-white/90">{t(h.key)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- البحث والفلاتر ---------- */}
      <section style={{ paddingBlock: '2.5rem 0' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div
            className="flex flex-col gap-4 rounded-3xl border border-line bg-navy-light"
            style={{ padding: '1.25rem' }}
          >
            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative block flex-1">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold"
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  style={{ padding: '0.8rem 1rem 0.8rem 3rem' }}
                  className="w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted focus:border-gold focus:outline-none"
                />
              </label>

              <label className="flex items-center gap-3">
                <span className="shrink-0 text-sm font-bold text-muted">{t('sortLabel')}</span>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  style={{ padding: '0.8rem 1rem' }}
                  className="w-full rounded-xl border border-line bg-navy font-bold text-white focus:border-gold focus:outline-none md:w-auto"
                >
                  <option value="newest">{t('sort_newest')}</option>
                  <option value="priceLow">{t('sort_priceLow')}</option>
                  <option value="priceHigh">{t('sort_priceHigh')}</option>
                </select>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-muted">{t('seatsLabel')}</span>
              {SEATS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeats(s)}
                  style={{ padding: '0.4rem 1.1rem' }}
                  className={`rounded-full border text-sm font-bold transition ${
                    seats === s
                      ? 'border-gold bg-gold text-navy shadow-md shadow-gold/30'
                      : 'border-line text-muted hover:border-gold hover:text-gold-light'
                  }`}
                >
                  {t(`seats_${s}`)}
                </button>
              ))}

              {hasFilters && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-sm font-bold text-gold-light hover:underline"
                  style={{ marginInlineStart: '0.5rem' }}
                >
                  {t('reset')}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- السيارات ---------- */}
      <section style={{ paddingBlock: '2rem 4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {!loading && !failed && cars.length > 0 && (
            <p className="text-muted" style={{ marginBlockEnd: '1.25rem' }}>
              {t('results', { n: list.length })}
            </p>
          )}

          {failed ? (
            <div
              className="rounded-3xl border border-red-500/40 bg-red-500/10 text-center"
              style={{ padding: '2.5rem 1.5rem' }}
            >
              <p className="text-lg font-bold text-red-300">{t('loadError')}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ padding: '0.6rem 1.6rem', marginBlockStart: '1rem' }}
                className="rounded-xl border border-red-400 font-bold text-red-300 transition hover:bg-red-400 hover:text-navy"
              >
                {t('retry')}
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="animate-pulse overflow-hidden rounded-3xl border border-line bg-navy-light"
                >
                  <div className="aspect-[4/3] bg-white/5" />
                  <div className="flex flex-col gap-3" style={{ padding: '1.25rem' }}>
                    <div className="h-5 w-2/3 rounded bg-white/10" />
                    <div className="h-4 w-1/2 rounded bg-white/5" />
                    <div className="h-10 rounded-xl bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : cars.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
              style={{ padding: '4rem 1.5rem' }}
            >
              <span className="text-gold">{carIcon('h-14 w-14')}</span>
              <p className="text-xl font-bold text-white">{t('emptyTitle')}</p>
              <p className="text-muted">{t('emptyText')}</p>
            </div>
          ) : list.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-3xl border border-line bg-navy-light text-center"
              style={{ padding: '3.5rem 1.5rem' }}
            >
              <p className="text-xl font-bold text-white">{t('noResultsTitle')}</p>
              <p className="text-muted">{t('noResultsText')}</p>
              <button
                type="button"
                onClick={reset}
                style={{ padding: '0.6rem 1.6rem', marginBlockStart: '0.5rem' }}
                className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
              >
                {t('reset')}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => {
                const name = isAr ? c.name_ar : c.name_en;
                const desc = isAr ? c.description_ar : c.description_en;
                const cover = c.images?.[0];
                const count = c.images?.length ?? 0;

                return (
                  <Link
                    key={c.id}
                    href={`/cars/${c.id}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-2xl hover:shadow-gold/15"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-navy">
                      {cover ? (
                        <img
                          src={cover}
                          alt={name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#1c2943] to-navy text-gold/60">
                          {carIcon('h-16 w-16')}
                        </div>
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-navy-light/70 via-transparent to-transparent" />

                      {c.brand && (
                        <span
                          dir="ltr"
                          className="absolute start-3 top-3 rounded-full bg-black/55 text-xs font-bold text-gold-light backdrop-blur"
                          style={{ padding: '0.25rem 0.8rem' }}
                        >
                          {c.brand}
                        </span>
                      )}

                      {count > 1 && (
                        <span
                          className="absolute end-3 top-3 rounded-full bg-black/55 text-xs font-bold text-white backdrop-blur"
                          style={{ padding: '0.25rem 0.8rem' }}
                        >
                          {t('imagesCount', { n: count })}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3" style={{ padding: '1.25rem 1.35rem 1.35rem' }}>
                      <h2 className="text-xl font-bold text-white transition-colors group-hover:text-gold-light">
                        {name}
                      </h2>

                      <div className="flex flex-wrap gap-2">
                        {c.year && (
                          <span
                            className="rounded-lg border border-line text-xs font-bold text-muted"
                            style={{ padding: '0.2rem 0.65rem' }}
                          >
                            {c.year}
                          </span>
                        )}
                        {c.seats && (
                          <span
                            className="rounded-lg border border-line text-xs font-bold text-muted"
                            style={{ padding: '0.2rem 0.65rem' }}
                          >
                            {t('seats', { n: c.seats })}
                          </span>
                        )}
                        {c.model && (
                          <span
                            dir="ltr"
                            className="rounded-lg border border-line text-xs font-bold text-muted"
                            style={{ padding: '0.2rem 0.65rem' }}
                          >
                            {c.model}
                          </span>
                        )}
                      </div>

                      {desc && <p className="line-clamp-2 leading-7 text-muted">{desc}</p>}

                      <div
                        className="mt-auto flex items-end justify-between gap-3 border-t border-line"
                        style={{ paddingBlockStart: '1rem' }}
                      >
                        <div>
                          <p className="text-xs text-muted">{t('from')}</p>
                          <p className="text-2xl font-extrabold text-gold-light">
                            {price(c)}
                            <span className="text-sm font-normal text-muted"> / {t('perDay')}</span>
                          </p>
                        </div>

                        <span
                          className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-gold to-gold-light text-sm font-bold text-navy transition group-hover:shadow-lg group-hover:shadow-gold/40"
                          style={{ padding: '0.55rem 1.1rem' }}
                        >
                          {t('viewBook')}
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                          >
                            <path d="m9 6 6 6-6 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------- محتاج مساعدة ---------- */}
      <section style={{ paddingBlock: '0 4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy text-center shadow-2xl shadow-black/40"
            style={{ padding: '3rem 1.5rem' }}
          >
            <span className="pointer-events-none absolute -top-20 start-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

            <h2
              className="relative text-3xl font-extrabold text-white"
              style={{ marginBlockEnd: '0.8rem' }}
            >
              {t('ctaTitle')}
            </h2>
            <p
              className="relative mx-auto max-w-xl leading-9 text-white/75"
              style={{ marginBlockEnd: '1.75rem' }}
            >
              {t('ctaText')}
            </p>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.85rem 2.2rem' }}
              className="relative inline-block rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('ctaWhatsapp')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}