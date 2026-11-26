'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '../lib/supabase/client';
import { useCurrency } from '../providers/CurrencyProvider';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Apartment = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  location_ar: string | null;
  location_en: string | null;
  bedrooms: number | null;
  max_guests: number | null;
  amenities: string[] | null;
  images: string[] | null;
  price_egp: number;
  price_usd: number;
};

type RoomsFilter = 'all' | 'r1' | 'r2' | 'r3';
type Sort = 'newest' | 'priceLow' | 'priceHigh';

const ROOMS: RoomsFilter[] = ['all', 'r1', 'r2', 'r3'];

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

const HIGHLIGHTS = [
  {
    key: 'hl1',
  },
  {
    key: 'hl2',
  },
  {
    key: 'hl3',
  },
  {
    key: 'hl4',
  },
] as const;

export default function ApartmentsPage() {
  const t = useTranslations('ApartmentsPage');
  const locale = useLocale();
  const { currency } = useCurrency();
  const isAr = locale === 'ar';

  const [items, setItems] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const [query, setQuery] = useState('');
  const [rooms, setRooms] = useState<RoomsFilter>('all');
  const [sort, setSort] = useState<Sort>('newest');

  useEffect(() => {
    let alive = true;

    createClient()
      .from('apartments')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!alive) return;
        if (error) {
          setFailed(true);
        } else {
          setItems(
            (data ?? []).map((a: any) => ({
              ...a,
              price_egp: Number(a.price_egp),
              price_usd: Number(a.price_usd),
              images: a.images ?? [],
              amenities: a.amenities ?? [],
            }))
          );
        }
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const price = (a: Apartment) => {
    const value = currency === 'EGP' ? a.price_egp : a.price_usd;
    return new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // المرفق المعروف بيتترجم، واللي اتكتب يدوي من الداش بورد بيظهر زي ما هو
  const amenityLabel = (k: string) => (t.has(`am_${k}`) ? t(`am_${k}`) : k);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = items.filter((a) => {
      if (rooms !== 'all') {
        if (a.bedrooms === null) return false;
        if (rooms === 'r1' && a.bedrooms > 1) return false;
        if (rooms === 'r2' && a.bedrooms !== 2) return false;
        if (rooms === 'r3' && a.bedrooms < 3) return false;
      }
      if (!q) return true;
      return `${a.name_ar} ${a.name_en} ${a.location_ar ?? ''} ${a.location_en ?? ''}`
        .toLowerCase()
        .includes(q);
    });

    const key = (a: Apartment) => (currency === 'EGP' ? a.price_egp : a.price_usd);
    if (sort === 'priceLow') return [...filtered].sort((a, b) => key(a) - key(b));
    if (sort === 'priceHigh') return [...filtered].sort((a, b) => key(b) - key(a));
    return filtered;
  }, [items, query, rooms, sort, currency]);

  const hasFilters = query.trim() !== '' || rooms !== 'all' || sort !== 'newest';

  function reset() {
    setQuery('');
    setRooms('all');
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
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  style={{ padding: '0.8rem 1rem' }}
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
              <span className="text-sm font-bold text-muted">{t('roomsLabel')}</span>
              {ROOMS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRooms(r)}
                  style={{ padding: '0.4rem 1.1rem' }}
                  className={`rounded-full border text-sm font-bold transition ${
                    rooms === r
                      ? 'border-gold bg-gold text-navy shadow-md shadow-gold/30'
                      : 'border-line text-muted hover:border-gold hover:text-gold-light'
                  }`}
                >
                  {t(`rooms_${r}`)}
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

      {/* ---------- الشقق ---------- */}
      <section style={{ paddingBlock: '2rem 4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {!loading && !failed && items.length > 0 && (
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
          ) : items.length === 0 ? (
            <div
              className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
              style={{ padding: '4rem 1.5rem' }}
            >
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
              {list.map((a) => {
                const name = isAr ? a.name_ar : a.name_en;
                const desc = isAr ? a.description_ar : a.description_en;
                const location = isAr ? a.location_ar : a.location_en;
                const cover = a.images?.[0];
                const count = a.images?.length ?? 0;
                const ams = a.amenities ?? [];

                return (
                  <Link
                    key={a.id}
                    href={`/apartments/${a.id}`}
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
                        <div aria-hidden="true" className="h-full w-full bg-linear-to-br from-navy-light to-navy" />
                      )}

                      <div className="absolute inset-0 bg-linear-to-t from-navy-light/70 via-transparent to-transparent" />

                      {location && (
                        <span
                          className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full bg-black/55 text-xs font-bold text-gold-light backdrop-blur"
                          style={{ padding: '0.25rem 0.8rem' }}
                        >
                          {location}
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
                        {a.bedrooms !== null && (
                          <span
                            className="rounded-lg border border-line text-xs font-bold text-muted"
                            style={{ padding: '0.2rem 0.65rem' }}
                          >
                            {a.bedrooms === 0 ? t('studio') : t('bedrooms', { n: a.bedrooms })}
                          </span>
                        )}
                        {a.max_guests !== null && (
                          <span
                            className="rounded-lg border border-line text-xs font-bold text-muted"
                            style={{ padding: '0.2rem 0.65rem' }}
                          >
                            {t('guests', { n: a.max_guests })}
                          </span>
                        )}
                      </div>

                      {desc && <p className="line-clamp-2 leading-7 text-muted">{desc}</p>}

                      {ams.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {ams.slice(0, 4).map((k) => (
                            <span
                              key={k}
                              className="rounded-full bg-gold/10 text-xs font-bold text-gold-light"
                              style={{ padding: '0.15rem 0.65rem' }}
                            >
                              {amenityLabel(k)}
                            </span>
                          ))}
                          {ams.length > 4 && (
                            <span className="text-xs font-bold text-gold" style={{ paddingBlock: '0.15rem' }}>
                              +{ams.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className="mt-auto flex items-end justify-between gap-3 border-t border-line"
                        style={{ paddingBlockStart: '1rem' }}
                      >
                        <div>
                          <p className="text-xs text-muted">{t('from')}</p>
                          <p className="text-2xl font-extrabold text-gold-light">
                            {price(a)}
                            <span className="text-sm font-normal text-muted"> / {t('perNight')}</span>
                          </p>
                        </div>

                        <span
                          className="flex items-center gap-1.5 rounded-xl bg-linear-to-br from-gold to-gold-light text-sm font-bold text-navy transition group-hover:shadow-lg group-hover:shadow-gold/40"
                          style={{ padding: '0.55rem 1.1rem' }}
                        >
                          {t('viewBook')}
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