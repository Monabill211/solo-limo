'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';

const CATS = ['all', 'booking', 'payment', 'cars', 'apartments', 'airport'] as const;
type Cat = (typeof CATS)[number];

const QUESTIONS: { n: number; cat: Exclude<Cat, 'all'> }[] = [
  { n: 1, cat: 'booking' },
  { n: 2, cat: 'booking' },
  { n: 3, cat: 'booking' },
  { n: 4, cat: 'booking' },
  { n: 5, cat: 'payment' },
  { n: 6, cat: 'payment' },
  { n: 7, cat: 'payment' },
  { n: 8, cat: 'payment' },
  { n: 9, cat: 'cars' },
  { n: 10, cat: 'cars' },
  { n: 11, cat: 'cars' },
  { n: 12, cat: 'apartments' },
  { n: 13, cat: 'apartments' },
  { n: 14, cat: 'apartments' },
  { n: 15, cat: 'airport' },
  { n: 16, cat: 'airport' },
];

const ARTICLES = [
  { n: 1, minutes: 4 },
  { n: 2, minutes: 4 },
  { n: 3, minutes: 5 },
  { n: 4, minutes: 3 },
];

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

export default function FaqPage() {
  const t = useTranslations('FaqPage');

  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<Cat>('all');
  const [openQ, setOpenQ] = useState<number | null>(null);
  const [openArt, setOpenArt] = useState<number | null>(null);

  const q = query.trim().toLowerCase();

  const list = QUESTIONS.filter((item) => {
    if (cat !== 'all' && item.cat !== cat) return false;
    if (!q) return true;
    return `${t(`q${item.n}`)} ${t(`a${item.n}`)}`.toLowerCase().includes(q);
  });

  return (
    <div>
      {/* ---------- الهيدر + البحث ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '4.5rem 4rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />

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

          <p className="text-lg leading-9 text-white/75" style={{ marginBlockEnd: '2rem' }}>
            {t('intro')}
          </p>

          <label className="relative block">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              style={{ paddingBlock: '1rem', paddingInline: '1rem 3rem' }}
              className="w-full rounded-2xl border border-line bg-navy text-white placeholder:text-muted focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('clear')}
                className="absolute end-4 top-1/2 flex h-7 w-7 -translate-y-1/2  justify-center rounded-full bg-gold/15 text-gold transition hover:bg-gold hover:text-navy"
              >
                ✕
              </button>
            )}
          </label>
        </div>
      </section>

      {/* ---------- الأسئلة السريعة ---------- */}
      <section style={{ paddingBlock: '4rem' }}>
        <div
          className="w-full max-w-3xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('quickBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('quickTitle')}</h2>
          </div>

          {/* الأقسام */}
          <div className="flex flex-wrap justify-center gap-2" style={{ marginBlockEnd: '2rem' }}>
            {CATS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCat(c);
                  setOpenQ(null);
                }}
                style={{ padding: '0.45rem 1.2rem' }}
                className={`rounded-full border text-sm font-bold transition ${
                  cat === c
                    ? 'border-gold bg-gold text-navy shadow-md shadow-gold/30'
                    : 'border-line text-muted hover:border-gold hover:text-gold-light'
                }`}
              >
                {t(`cat_${c}`)}
              </button>
            ))}
          </div>

          {/* القائمة */}
          {list.length === 0 ? (
            <div
              className="rounded-2xl border border-line bg-navy-light text-center"
              style={{ padding: '2.5rem 1.5rem' }}
            >
              <p className="text-lg font-bold text-white" style={{ marginBlockEnd: '0.4rem' }}>
                {t('noResultsTitle')}
              </p>
              <p className="text-muted">{t('noResultsText')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {list.map((item) => {
                const isOpen = openQ === item.n;
                return (
                  <div
                    key={item.n}
                    className={`overflow-hidden rounded-2xl border bg-navy-light transition-all duration-300 ${
                      isOpen
                        ? 'border-gold shadow-lg shadow-gold/10'
                        : 'border-line hover:border-gold/60'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenQ(isOpen ? null : item.n)}
                      style={{ padding: '1.1rem 1.25rem' }}
                      className="flex w-full  justify-between gap-4 text-start"
                    >
                      <span
                        className={`text-lg font-bold transition-colors ${
                          isOpen ? 'text-gold-light' : 'text-white'
                        }`}
                      >
                        {t(`q${item.n}`)}
                      </span>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line transition-all duration-300 ${
                          isOpen ? 'rotate-180 bg-gold text-navy' : 'text-gold'
                        }`}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          className="h-4 w-4"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p
                          className="leading-8 text-muted"
                          style={{ padding: '0 1.25rem 1.25rem' }}
                        >
                          {t(`a${item.n}`)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---------- المقالات ---------- */}
      <section className="border-y border-line bg-navy-light/50" style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2.75rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('articlesBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('articlesTitle')}</h2>
            <p className="mx-auto max-w-2xl text-muted" style={{ marginBlockStart: '0.7rem' }}>
              {t('articlesSubtitle')}
            </p>
          </div>

          <div className="grid items-start gap-6 md:grid-cols-2">
            {ARTICLES.map((a) => {
              const isOpen = openArt === a.n;
              return (
                <article
                  key={a.n}
                  className={`overflow-hidden rounded-3xl border bg-navy transition-all duration-300 ${
                    isOpen
                      ? 'border-gold shadow-xl shadow-gold/10'
                      : 'border-line hover:border-gold/60'
                  }`}
                >
                  <div className="flex flex-col gap-3" style={{ padding: '1.75rem' }}>
                    <div className="flex  justify-between gap-3">
                      <span
                        className="rounded-full bg-gold font-bold text-navy"
                        style={{ padding: '0.2rem 0.85rem', fontSize: '0.8rem' }}
                      >
                        {t(`art${a.n}Category`)}
                      </span>
                      <span className="text-sm text-muted">{t('minutes', { n: a.minutes })}</span>
                    </div>

                    <h3 className="text-2xl font-bold leading-snug text-white">
                      {t(`art${a.n}Title`)}
                    </h3>
                    <p className="leading-8 text-muted">{t(`art${a.n}Excerpt`)}</p>

                    <div
                      className={`grid transition-[grid-template-rows] duration-500 ease-out ${
                        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div
                          className="flex flex-col gap-4 border-t border-line leading-8 text-white/80"
                          style={{ paddingBlockStart: '1.25rem', marginBlockStart: '0.5rem' }}
                        >
                          {[1, 2, 3, 4].map((p) => (
                            <p key={p}>{t(`art${a.n}P${p}`)}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenArt(isOpen ? null : a.n)}
                      className="flex w-fit  gap-1.5 font-bold text-gold transition hover:text-gold-light"
                    >
                      {isOpen ? t('close') : t('readArticle')}
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={`h-4 w-4 transition-transform duration-300 ${
                          isOpen ? '-rotate-90' : 'rotate-90'
                        }`}
                      >
                        <path d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- لسه عندك سؤال ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy text-center shadow-2xl shadow-black/40"
            style={{ padding: '3.25rem 1.5rem' }}
          >
            <span className="pointer-events-none absolute -top-20 start-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />

            <h2
              className="relative text-3xl font-extrabold text-white md:text-4xl"
              style={{ marginBlockEnd: '0.9rem' }}
            >
              {t('ctaTitle')}
            </h2>
            <p
              className="relative mx-auto max-w-xl leading-9 text-white/75"
              style={{ marginBlockEnd: '2rem' }}
            >
              {t('ctaText')}
            </p>

            <div className="relative flex flex-wrap justify-center gap-3">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
              >
                {t('ctaWhatsapp')}
              </a>
              <Link
                href="/contact"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:border-gold hover:bg-gold hover:text-navy"
              >
                {t('ctaContact')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}