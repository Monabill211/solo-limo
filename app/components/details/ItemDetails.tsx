'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/app/lib/supabase/client';
import { useCurrency } from '@/app/providers/CurrencyProvider';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Kind = 'car' | 'apartment';

type Row = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  images: string[] | null;
  price_egp: number;
  price_usd: number;
  // سيارات
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  seats?: number | null;
  // شقق
  location_ar?: string | null;
  location_en?: string | null;
  bedrooms?: number | null;
  max_guests?: number | null;
  amenities?: string[] | null;
};

export default function ItemDetails({ type, id }: { type: Kind; id: string }) {
  const t = useTranslations('Details');
  const am = useTranslations('ApartmentsPage');
  const isAr = useLocale() === 'ar';
  const { currency } = useCurrency();
  const isCar = type === 'car';

  const [row, setRow] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let alive = true;

    createClient()
      .from(isCar ? 'cars' : 'apartments')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return;
        if (!error && data) {
          setRow({
            ...(data as Row),
            price_egp: Number((data as any).price_egp),
            price_usd: Number((data as any).price_usd),
            images: (data as any).images ?? [],
            amenities: (data as any).amenities ?? [],
          });
        }
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, isCar]);

  const backHref = isCar ? '/cars' : '/apartments';
  const backLabel = isCar ? t('backCars') : t('backApartments');

  if (loading) {
    return (
      <div className="w-full max-w-6xl" style={{ marginInline: 'auto', padding: '2.5rem 1rem' }}>
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="aspect-[4/3] animate-pulse rounded-3xl border border-line bg-navy-light" />
          <div className="flex flex-col gap-4">
            <div className="h-8 w-2/3 animate-pulse rounded bg-white/10" />
            <div className="h-5 w-1/2 animate-pulse rounded bg-white/5" />
            <div className="h-40 animate-pulse rounded-3xl border border-line bg-navy-light" />
          </div>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="text-center" style={{ padding: '5rem 1rem' }}>
        <p className="text-2xl font-bold text-white" style={{ marginBlockEnd: '0.6rem' }}>
          {t('notFoundTitle')}
        </p>
        <p className="text-muted" style={{ marginBlockEnd: '1.5rem' }}>{t('notFoundText')}</p>
        <Link
          href={backHref}
          style={{ padding: '0.7rem 1.8rem' }}
          className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
        >
          {backLabel}
        </Link>
      </div>
    );
  }

  const name = isAr ? row.name_ar : row.name_en;
  const desc = isAr ? row.description_ar : row.description_en;
  const location = isAr ? row.location_ar : row.location_en;
  const images = row.images ?? [];
  const count = images.length;
  const price = new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(currency === 'EGP' ? row.price_egp : row.price_usd);

  const amenityLabel = (k: string) => (am.has(`am_${k}`) ? am(`am_${k}`) : k);

  const specs: { label: string; value: string }[] = isCar
    ? [
        row.brand ? { label: t('brand'), value: row.brand } : null,
        row.model ? { label: t('model'), value: row.model } : null,
        row.year ? { label: t('year'), value: String(row.year) } : null,
        row.seats ? { label: t('seatsLabel'), value: t('seats', { n: row.seats }) } : null,
      ].filter(Boolean) as { label: string; value: string }[]
    : [
        location ? { label: t('location'), value: location } : null,
        row.bedrooms !== null && row.bedrooms !== undefined
          ? { label: t('bedroomsLabel'), value: row.bedrooms === 0 ? t('studio') : t('bedrooms', { n: row.bedrooms }) }
          : null,
        row.max_guests ? { label: t('guestsLabel'), value: t('guests', { n: row.max_guests }) } : null,
      ].filter(Boolean) as { label: string; value: string }[];

  const go = (n: number) => setActive((a) => (a + n + count) % count);

  const bookHref = `/booking?type=${type}&id=${row.id}`;
  const waText = encodeURIComponent(`${t('waMessage')} ${name}`);

  const galleryButton =
    'absolute top-1/2 flex min-h-10 -translate-y-1/2 items-center justify-center rounded-lg border border-line bg-navy/85 text-xs font-bold text-white backdrop-blur transition hover:bg-gold hover:text-navy';

  return (
    <div className="w-full max-w-6xl" style={{ marginInline: 'auto', padding: '2.5rem 1rem 4rem' }}>
      <Link
        href={backHref}
        className="inline-block text-sm font-bold text-gold-light hover:underline"
        style={{ marginBlockEnd: '1.5rem' }}
      >
        {backLabel}
      </Link>

      <div className="grid items-start gap-8 lg:grid-cols-[1.4fr_1fr]">
        {/* ================= المعرض ================= */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-line bg-navy-light">
            {count > 0 ? (
              <img
                key={images[active]}
                src={images[active]}
                alt={name}
                className="h-full w-full animate-[fadeIn_0.4s_ease-out] object-cover"
              />
            ) : (
              <div aria-hidden="true" className="h-full w-full bg-linear-to-br from-navy-light to-navy" />
            )}

            {count > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} aria-label={t('prev')} className={`${galleryButton} start-3`} style={{ paddingInline: '0.65rem' }}>
                  {t('prev')}
                </button>
                <button type="button" onClick={() => go(1)} aria-label={t('next')} className={`${galleryButton} end-3`} style={{ paddingInline: '0.65rem' }}>
                  {t('next')}
                </button>
                <span
                  className="absolute bottom-3 end-3 rounded-full bg-black/55 text-xs font-bold text-white backdrop-blur"
                  style={{ padding: '0.25rem 0.8rem' }}
                >
                  {active + 1} / {count}
                </span>
              </>
            )}
          </div>

          {count > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`${t('photo')} ${i + 1}`}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === active ? 'border-gold' : 'border-line opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* الوصف والمرافق */}
          <div style={{ marginBlockStart: '1.25rem' }} className="flex flex-col gap-6">
            <section>
              <h2 className="text-xl font-bold text-gold" style={{ marginBlockEnd: '0.7rem' }}>
                {t('about')}
              </h2>
              <p className="leading-9 text-white/80">{desc || t('noDescription')}</p>
            </section>

            {!isCar && (row.amenities?.length ?? 0) > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gold" style={{ marginBlockEnd: '0.9rem' }}>
                  {t('amenities')}
                </h2>
                <div className="flex flex-wrap gap-2.5">
                  {row.amenities!.map((k) => (
                    <span
                      key={k}
                      className="flex items-center gap-2 rounded-full border border-line bg-navy-light text-sm font-bold text-white/90"
                      style={{ padding: '0.4rem 1rem' }}
                    >
                      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                      {amenityLabel(k)}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* ================= كارت الحجز ================= */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-40">
          <div>
            <span
              className="inline-block rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold-light"
              style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.7rem' }}
            >
              {isCar ? t('badgeCar') : t('badgeApartment')}
            </span>
            <h1 className="text-3xl font-extrabold leading-snug text-white md:text-4xl">{name}</h1>
            {!isCar && location && (
              <p className="flex items-center gap-1.5 text-muted" style={{ marginBlockStart: '0.5rem' }}>
                {location}
              </p>
            )}
          </div>

          {specs.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {specs.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-line bg-navy-light"
                  style={{ padding: '0.8rem 1rem' }}
                >
                  <p className="text-xs text-muted">{s.label}</p>
                  <p className="truncate font-bold text-white">{s.value}</p>
                </div>
              ))}
            </div>
          )}

          <div
            className="rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy shadow-2xl shadow-black/40"
            style={{ padding: '1.5rem' }}
          >
            <p className="text-sm text-muted">{t('from')}</p>
            <p className="text-4xl font-extrabold text-gold-light" style={{ marginBlockEnd: '1.25rem' }}>
              {price}
              <span className="text-base font-normal text-muted"> / {isCar ? t('perDay') : t('perNight')}</span>
            </p>

            <Link
              href={bookHref}
              style={{ padding: '0.9rem 1.5rem' }}
              className="block rounded-xl bg-linear-to-br from-gold to-gold-light text-center text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('bookNow')}
            </Link>

            <a
              href={`${WHATSAPP_URL}?text=${waText}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.8rem 1.5rem', marginBlockStart: '0.75rem' }}
              className="block rounded-xl border border-white/20 bg-white/5 text-center font-bold text-white transition hover:border-[#25d366] hover:bg-[#25d366]"
            >
              {t('askWhatsapp')}
            </a>

            <ul className="flex flex-col gap-2 text-sm text-muted" style={{ marginBlockStart: '1.25rem' }}>
              {[t('trust1'), t('trust2'), t('trust3')].map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}