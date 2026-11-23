// قالب عام لسياسة الخصوصية، يفضّل مراجعته مع مختص قانوني قبل الإطلاق

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';

// n = رقم القسم، bullets = عدد النقاط جواه
const SECTIONS = [
  { n: 1, bullets: 4 },
  { n: 2, bullets: 4 },
  { n: 3, bullets: 0 },
  { n: 4, bullets: 3 },
  { n: 5, bullets: 0 },
  { n: 6, bullets: 0 },
  { n: 7, bullets: 0 },
  { n: 8, bullets: 0 },
  { n: 9, bullets: 0 },
  { n: 10, bullets: 0 },
];

export default function PrivacyPage() {
  const t = useTranslations('PrivacyPage');

  return (
    <div>
      {/* ---------- الهيدر ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '4.5rem 4rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 end-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />

        <div
          className="w-full max-w-3xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span
            className="inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
            style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}
          >
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

          <p className="text-lg leading-9 text-white/75" style={{ marginBlockEnd: '1.25rem' }}>
            {t('intro')}
          </p>

          <span className="text-sm text-muted">{t('updated')}</span>
        </div>
      </section>

      {/* ---------- المحتوى ---------- */}
      <section style={{ paddingBlock: '4rem' }}>
        <div
          className="grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[17rem_1fr]"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {/* ----- الفهرس ----- */}
          <aside
            className="rounded-3xl border border-line bg-navy-light lg:sticky lg:top-36"
            style={{ padding: '1.5rem' }}
          >
            <p className="font-bold text-gold" style={{ marginBlockEnd: '1rem' }}>
              {t('tocTitle')}
            </p>
            <nav className="flex flex-col gap-1.5">
              {SECTIONS.map((s) => (
                <a
                  key={s.n}
                  href={`#s${s.n}`}
                  style={{ padding: '0.4rem 0.6rem' }}
                  className="flex items-center gap-2.5 rounded-lg text-sm text-muted transition hover:bg-navy hover:text-gold-light"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                    {s.n}
                  </span>
                  {t(`s${s.n}Title`)}
                </a>
              ))}
            </nav>
          </aside>

          {/* ----- الأقسام ----- */}
          <div className="flex flex-col gap-6">
            {SECTIONS.map((s) => (
              <article
                key={s.n}
                id={`s${s.n}`}
                className="scroll-mt-40 rounded-3xl border border-line bg-navy-light transition-colors duration-300 hover:border-gold/60"
                style={{ padding: '1.9rem 1.75rem' }}
              >
                <div className="flex items-center gap-3" style={{ marginBlockEnd: '0.9rem' }}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-gold to-gold-light font-extrabold text-navy">
                    {s.n}
                  </span>
                  <h2 className="text-xl font-bold text-white md:text-2xl">{t(`s${s.n}Title`)}</h2>
                </div>

                <p className="leading-9 text-muted">{t(`s${s.n}Text`)}</p>

                {s.bullets > 0 && (
                  <ul className="flex flex-col gap-2.5" style={{ marginBlockStart: '1rem' }}>
                    {Array.from({ length: s.bullets }, (_, i) => i + 1).map((b) => (
                      <li key={b} className="flex items-start gap-3 leading-8 text-white/85">
                        <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                        {t(`s${s.n}B${b}`)}
                      </li>
                    ))}
                  </ul>
                )}

                {s.n === 10 && (
                  <div className="flex flex-wrap gap-3" style={{ marginBlockStart: '1.5rem' }}>
                    <a
                      href={WHATSAPP_URL}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '0.7rem 1.8rem' }}
                      className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
                    >
                      {t('contactWhatsapp')}
                    </a>
                    <Link
                      href="/contact"
                      style={{ padding: '0.7rem 1.8rem' }}
                      className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
                    >
                      {t('contactPage')}
                    </Link>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}