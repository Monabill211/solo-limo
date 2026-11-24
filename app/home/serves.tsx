// الاستخدام: <ServiceCards />

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const icon = (path: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-8 w-8"
  >
    {path}
  </svg>
);

const SERVICES = [
  {
    key: 'airport',
    href: '/airport-guide',
    svg: icon(
      <>
        <path d="M21 3L3 10.5l6.5 2.5L12 21l9-18z" />
        <path d="M9.5 13L21 3" />
      </>
    ),
  },
  {
    key: 'cars',
    href: '/cars',
    svg: icon(
      <>
        <path d="M3 15l1.6-5.2A2 2 0 0 1 6.5 8.4h11a2 2 0 0 1 1.9 1.4L21 15" />
        <rect x="3" y="15" width="18" height="4" rx="1" />
        <circle cx="7" cy="17" r="0.6" />
        <circle cx="17" cy="17" r="0.6" />
      </>
    ),
  },
  {
    key: 'apartments',
    href: '/apartments',
    svg: icon(
      <>
        <rect x="5" y="3" width="14" height="18" rx="1" />
        <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
      </>
    ),
  },
] as const;

export default function ServiceCards() {
  const t = useTranslations('ServiceCards');

  return (
    <section
          className="relative isolate flex flex-col justify-between overflow-hidden bg-navy"

    style={{ paddingBlock: '4.5rem' ,
        backgroundImage:"linear-gradient(to top, rgb(11 18 32 / 0.98) 15%, rgb(11 18 32 / 0.7) 55%, rgb(11 18 32 / 0.4))"

    }}>
      <div
        className="w-full max-w-6xl"
        style={{ marginInline: 'auto', paddingInline: '1rem' }}
      >
        <div className="text-center" style={{ marginBlockEnd: '3rem' }}>
          <span
            className="inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
            style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}
          >
            {t('badge')}
          </span>
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('title')}</h2>
          <p className="mx-auto max-w-2xl text-muted" style={{ marginBlockStart: '0.7rem' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((s, i) => (
            <div
              key={s.key}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-2xl hover:shadow-gold/15"
              style={{ padding: '2.25rem 1.9rem' }}
            >
              <span className="pointer-events-none absolute -top-16 -end-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/25" />
              <span className="pointer-events-none absolute end-5 top-3 select-none text-7xl font-extrabold text-white/5">
                0{i + 1}
              </span>

              <span
                className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold transition duration-300 group-hover:bg-gold group-hover:text-navy"
                style={{ marginBlockEnd: '1.5rem' }}
              >
                {s.svg}
              </span>

              <h3
                className="relative text-2xl font-bold text-white transition-colors group-hover:text-gold-light"
                style={{ marginBlockEnd: '0.7rem' }}
              >
                {t(`${s.key}Title`)}
              </h3>

              <p className="relative leading-8 text-muted" style={{ marginBlockEnd: '1.25rem' }}>
                {t(`${s.key}Text`)}
              </p>

              <ul className="relative flex flex-col gap-2.5" style={{ marginBlockEnd: '2rem' }}>
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex items-center gap-2.5 text-white/85">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy">
                      ✓
                    </span>
                    {t(`${s.key}F${n}`)}
                  </li>
                ))}
              </ul>

              <Link
                href={s.href}
                style={{ padding: '0.75rem 1.5rem' }}
                className="relative mt-auto flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40"
              >
                {t(`${s.key}Button`)}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                >
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}