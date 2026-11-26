// الاستخدام: <ServiceCards />

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const SERVICES = [
  {
    key: 'airport',
    href: '/airport-guide',
  },
  {
    key: 'cars',
    href: '/cars',
  },
  {
    key: 'apartments',
    href: '/apartments',
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
          <p className="max-w-2xl text-muted" style={{ marginInline: 'auto', marginBlockStart: '0.7rem' }}>
            {t('subtitle')}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {SERVICES.map((s) => (
            <div
              key={s.key}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line border-t-gold/40 bg-navy-light transition duration-300 hover:-translate-y-2 hover:border-gold hover:shadow-2xl hover:shadow-gold/15"
              style={{ padding: '2.25rem 1.9rem' }}
            >
              <span className="pointer-events-none absolute -top-16 -end-16 h-44 w-44 rounded-full bg-gold/10 blur-3xl transition duration-500 group-hover:bg-gold/25" />


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
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {t(`${s.key}F${n}`)}
                  </li>
                ))}
              </ul>

              <Link
                href={s.href}
                style={{ padding: '0.75rem 1.5rem', marginBlockStart: 'auto' }}
                className="relative flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40"
              >
                {t(`${s.key}Button`)}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}