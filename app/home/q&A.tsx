'use client';

// الاستخدام: <FaqSection />

import { useState } from 'react';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';
const ITEMS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function FaqSection() {
  const t = useTranslations('Faq');
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section 
          className="relative isolate flex flex-col justify-between overflow-hidden bg-navy"

    style={{ paddingBlock: '4rem' }}>
      <div
        className="w-full max-w-3xl"
        style={{ marginInline: 'auto', paddingInline: '1rem' }}
      >
        <h2
          className="text-center text-3xl font-bold text-gold md:text-4xl"
          style={{ marginBlockEnd: '0.6rem' }}
        >
          {t('title')}
        </h2>
        <p className="text-center text-muted" style={{ marginBlockEnd: '2.5rem' }}>
          {t('subtitle')}
        </p>

        <div className="flex flex-col gap-3">
          {ITEMS.map((n, i) => {
            const isOpen = open === i;
            return (
              <div
                key={n}
                className={`overflow-hidden rounded-2xl border bg-navy-light transition-all duration-300 ${
                  isOpen
                    ? 'border-gold shadow-lg shadow-gold/10'
                    : 'border-line hover:border-gold/60'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{ padding: '1.1rem 1.25rem' }}
                  className="flex w-full  justify-between gap-4 text-start"
                >
                  <span
                    className={`text-lg font-bold transition-colors ${
                      isOpen ? 'text-gold-light' : 'text-white'
                    }`}
                  >
                    {t(`q${n}`)}
                  </span>

                  <span
                    className={`flex items-center h-8 w-8 shrink-0  justify-center rounded-full border border-line transition-all duration-300 ${
                      isOpen ? 'rotate-45 bg-gold text-navy' : 'text-gold'
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
                      <path d="M12 5v14M5 12h14" />
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
                      {t(`a${n}`)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div
          className="flex flex-col  gap-3 rounded-2xl border border-line bg-navy-light text-center"
          style={{ marginBlockStart: '2.5rem', padding: '1.75rem 1.25rem' }}
        >
          <p className="text-lg font-bold text-white">{t('stillAsking')}</p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '0.6rem 1.8rem' }}
            className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
          >
            {t('whatsapp')}
          </a>
        </div>
      </div>
    </section>
  );
}