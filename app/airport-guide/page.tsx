'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/app/lib/supabase/client';
import { useCurrency } from '@/app/providers/CurrencyProvider';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '201044443195';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

type Service = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  features_ar: string | null;
  features_en: string | null;
  price_egp: number;
  price_usd: number;
  featured: boolean;
};

// الشكل اللي راجع من Supabase (الأرقام ممكن ترجع string)
type ServiceRow = Omit<Service, 'price_egp' | 'price_usd'> & {
  price_egp: number | string;
  price_usd: number | string;
};

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

const STEPS = [1, 2, 3, 4] as const;

export default function AirportServicesPage() {
  const t = useTranslations('AirportServices');
  const isAr = useLocale() === 'ar';
  const { currency } = useCurrency();

  const supabase = useMemo(() => createClient(), []);

  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);

    const { data, error } = await supabase
      .from('airport_services')
      .select('id,name_ar,name_en,description_ar,description_en,features_ar,features_en,price_egp,price_usd,featured')
      .eq('active', true)
      .order('sort_order').order('name_ar').order('id');

    if (error) {
      setFailed(true);
    } else {
      setItems(
        ((data ?? []) as ServiceRow[]).map((s) => ({
          ...s,
          featured: Boolean(s.featured),
          price_egp: Number(s.price_egp),
          price_usd: Number(s.price_usd),
        }))
      );
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let alive = true;

    (async () => {
      await load();
      if (!alive) return;
    })();

    return () => {
      alive = false;
    };
  }, [load]);

  const price = (s: Service) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(currency === 'EGP' ? s.price_egp : s.price_usd);

  const lines = (text: string | null) =>
    (text ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

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

        <div className="w-full max-w-3xl text-center" style={{ marginInline: 'auto', paddingInline: '1rem' }}>
          <div style={{ marginBlockEnd: '1.25rem' }}>
            <span className={badgeClass} style={{ padding: '0.3rem 1rem' }}>
              {t('badge')}
            </span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl md:leading-tight" style={{ marginBlockEnd: '1rem' }}>
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

      {/* ---------- الخدمات ---------- */}
      <section style={{ paddingBlock: '4rem' }}>
        <div className="w-full max-w-6xl" style={{ marginInline: 'auto', paddingInline: '1rem' }}>
          {failed ? (
            <div className="rounded-3xl border border-red-500/40 bg-red-500/10 text-center" style={{ padding: '2.5rem 1.5rem' }}>
              <p className="text-lg font-bold text-red-300">{t('loadError')}</p>
              <button
                type="button"
                onClick={load}
                style={{ padding: '0.6rem 1.6rem', marginBlockStart: '1rem' }}
                className="rounded-xl border border-red-400 font-bold text-red-300 transition hover:bg-red-400 hover:text-navy"
              >
                {t('retry')}
              </button>
            </div>
          ) : loading ? (
            <div className="grid gap-6 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-96 animate-pulse rounded-3xl border border-line bg-navy-light" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center" style={{ padding: '4rem 1.5rem' }}>
              <p className="text-xl font-bold text-white">{t('emptyTitle')}</p>
              <p className="text-muted">{t('emptyText')}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {items.map((s) => (
                <div
                  key={s.id}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border border-t-gold/40 bg-navy-light transition duration-300 md:hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold/15 ${
                    s.featured ? 'border-gold' : 'border-line hover:border-gold'
                  }`}
                  style={{ padding: '2rem 1.7rem' }}
                >
                  <span className="pointer-events-none absolute -top-16 -end-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/25" />

                  {s.featured && (
                    <span className="absolute end-4 top-4 rounded-full bg-gold text-xs font-bold text-navy" style={{ padding: '0.2rem 0.8rem' }}>
                      {t('popular')}
                    </span>
                  )}


                  <h2 className="relative text-2xl font-bold text-white transition-colors group-hover:text-gold-light" style={{ marginBlockEnd: '0.6rem' }}>
                    {isAr ? s.name_ar : s.name_en}
                  </h2>

                  <p className="relative leading-8 text-muted" style={{ marginBlockEnd: '1.1rem' }}>
                    {isAr ? s.description_ar : s.description_en}
                  </p>

                  <ul className="relative flex flex-col gap-2.5" style={{ marginBlockEnd: '1.5rem' }}>
                    {lines(isAr ? s.features_ar : s.features_en).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2.5 text-white/85">
                        <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" style={{ marginBlockStart: '0.55rem' }} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="relative border-t border-line" style={{ marginBlockStart: 'auto', paddingBlockStart: '1.25rem' }}>
                    <p className="text-xs text-muted">{t('from')}</p>
                    <p className="text-3xl font-extrabold text-gold-light" style={{ marginBlockEnd: '1rem' }}>
                      {price(s)}
                      <span className="text-sm font-normal text-muted"> / {t('perService')}</span>
                    </p>

                    <Link
                      href={`/booking?type=airport&id=${s.id}`}
                      style={{ padding: '0.8rem 1.5rem' }}
                      className="block rounded-xl bg-linear-to-br from-gold to-gold-light text-center font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40"
                    >
                      {t('bookNow')}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- طريقة الحجز ---------- */}
      <section className="border-y border-line bg-navy-light/50" style={{ paddingBlock: '4.5rem' }}>
        <div className="w-full max-w-6xl" style={{ marginInline: 'auto', paddingInline: '1rem' }}>
          <div className="text-center" style={{ marginBlockEnd: '3rem' }}>
            <div style={{ marginBlockEnd: '0.9rem' }}>
              <span className={badgeClass} style={{ padding: '0.25rem 0.9rem' }}>
                {t('stepsBadge')}
              </span>
            </div>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('stepsTitle')}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((n) => (
              <div key={n} className="relative rounded-3xl border border-line bg-navy text-center" style={{ padding: '2.5rem 1.5rem 2rem' }}>
                <span className="absolute -top-5 start-1/2 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-lg font-extrabold text-navy shadow-lg shadow-gold/30 rtl:translate-x-1/2">
                  {n}
                </span>
                <h3 className="text-lg font-bold text-white" style={{ marginBlockEnd: '0.6rem' }}>
                  {t(`step${n}Title`)}
                </h3>
                <p className="leading-8 text-muted">{t(`step${n}Text`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- محتاج مساعدة ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div className="w-full max-w-4xl" style={{ marginInline: 'auto', paddingInline: '1rem' }}>
          <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy text-center shadow-2xl shadow-black/40" style={{ padding: '3rem 1.5rem' }}>
            <span className="pointer-events-none absolute -top-20 start-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl rtl:translate-x-1/2" />
            <h2 className="relative text-3xl font-extrabold text-white" style={{ marginBlockEnd: '0.8rem' }}>
              {t('ctaTitle')}
            </h2>
            <p className="relative max-w-xl leading-9 text-white/75" style={{ marginInline: 'auto', marginBlockEnd: '1.75rem' }}>
              {t('ctaText')}
            </p>
            <a
              href={`${WHATSAPP_URL}?text=${encodeURIComponent(t('ctaWaMessage'))}`}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.85rem 2.2rem' }}
              className="relative inline-block rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('ctaWhatsapp')}
            </a>
          </div>

          <p className="text-center text-sm leading-7 text-muted" style={{ marginBlockStart: '1.5rem' }}>
            {t('disclaimer')}
          </p>
        </div>
      </section>
    </div>
  );
}
