'use client';

// الاستخدام: <PromoBanner />
// غيّر PROMO_CODE لكود الخصم الحقيقي اللي هتعمله من الداش بورد

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const PROMO_CODE = 'SOLO10';

export default function PromoBanner() {
  const t = useTranslations('Promo');
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <section className="bg-navy" style={{ paddingBlock: '3.5rem' }}>
      <div
        className="w-full max-w-5xl"
        style={{ marginInline: 'auto', paddingInline: '1rem' }}
      >
        <div className="relative flex flex-col overflow-hidden rounded-3xl border border-gold/40 bg-navy-light shadow-2xl shadow-black/40 md:flex-row">
          <span className="pointer-events-none absolute -top-24 -start-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />

          {/* ---------- النص والأزرار ---------- */}
          <div
            className="relative flex flex-1 flex-col gap-4"
            style={{ padding: '2rem 1.75rem' }}
          >
            <span
              className="inline-flex w-fit  gap-2 rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
              style={{ padding: '0.3rem 0.9rem' }}
            >
              {t('badge')}
            </span>

            <h2 className="text-3xl font-extrabold leading-snug text-white md:text-4xl">
              {t.rich('title', {
                g: (chunks) => <span className="text-gold">{chunks}</span>,
              })}
            </h2>

            <p className="max-w-lg leading-8 text-muted">{t('text')}</p>

            <div className="flex flex-wrap gap-3" style={{ marginBlockStart: '0.5rem' }}>
              <Link
                href="/login?mode=signup"
                style={{ padding: '0.65rem 1.8rem' }}
                className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
              >
                {t('signup')}
              </Link>
              <Link
                href="/login"
                style={{ padding: '0.65rem 1.8rem' }}
                className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
              >
                {t('login')}
              </Link>
            </div>
          </div>

          {/* ---------- التذكرة (كود الخصم) ---------- */}
          <div
            className="relative flex flex-col  justify-center gap-3 border-t-2 border-dashed border-gold/40 bg-navy/60 md:w-72 md:border-s-2 md:border-t-0"
            style={{ padding: '2rem 1.5rem' }}
          >
            <span className="absolute -top-3 start-1/2 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-navy md:start-0 md:block md:-translate-x-1/2 md:rtl:translate-x-1/2" />
            <span className="absolute -bottom-3 start-1/2 hidden h-6 w-6 -translate-x-1/2 rounded-full bg-navy md:start-0 md:block md:-translate-x-1/2 md:rtl:translate-x-1/2" />

            <span className="text-sm text-muted">{t('codeLabel')}</span>

            <div
              dir="ltr"
              className="rounded-xl border-2 border-dashed border-gold text-2xl font-extrabold tracking-[0.3em] text-gold-light"
              style={{ padding: '0.6rem 1.4rem' }}
            >
              {PROMO_CODE}
            </div>

            <button
              type="button"
              onClick={copy}
              style={{ padding: '0.45rem 1.3rem' }}
              className={`rounded-lg text-sm font-bold transition ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'border border-line text-white hover:border-gold hover:text-gold-light'
              }`}
            >
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}