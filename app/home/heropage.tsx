// الاستخدام: <HeroBanner />
// صورة الخلفية: حطها في  public/hero.jpg  (الأفضل عرضها 1920px وفوق)

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';

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

export default function HeroPage() {
  const t = useTranslations('Heropage');

  return (
    <section className="relative isolate overflow-hidden bg-navy">
      {/* ---------- صورة الخلفية ---------- */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url('/hero.png')" }}
      />

      {/* ---------- طبقات التغميق عشان الكلام يبان ---------- */}
      <div className="absolute inset-0 -z-10 bg-linear-to-t from-navy via-navy/55 to-navy/30" />
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-navy/90 via-navy/45 to-transparent rtl:bg-linear-to-l" />
      <span className="pointer-events-none absolute -bottom-32 start-1/3 -z-10 h-96 w-96 animate-pulse rounded-full bg-gold/15 blur-3xl" />

      <div
        className="flex w-full max-w-6xl flex-col justify-center"
        style={{
          marginInline: 'auto',
          paddingInline: '1rem',
          paddingBlock: '5rem 3.5rem',
          minHeight: '88vh',
        }}
      >
        {/* ---------- الكلام ---------- */}
        <div className="max-w-2xl">

          <h1
            className="text-4xl font-extrabold leading-tight text-white md:text-6xl md:leading-tight"
            style={{ marginBlockEnd: '1.25rem' }}
          >
            {t.rich('title', {
              g: (chunks) => (
                <span className="bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p
            className="text-lg leading-9 text-white/80 md:text-xl"
            style={{ marginBlockEnd: '2.25rem' }}
          >
            {t('text')}
          </p>

          <div className="flex flex-wrap  gap-3">
            <Link
              href="/cars"
              style={{ padding: '0.85rem 2.2rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('book')}
            </Link>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.85rem 2.2rem' }}
              className="rounded-xl border border-white/25 bg-white/10 text-lg font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-[#25d366] hover:bg-[#25d366]"
            >
              {t('whatsapp')}
            </a>
          </div>
        </div>

        {/* ---------- كروت الخدمات ---------- */}
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-3"
          style={{ marginBlockStart: '4rem' }}
        >
          {SERVICES.map((s) => (
            <Link
              key={s.key}
              href={s.href}
              style={{ padding: '1.25rem 1.4rem' }}
              className="group flex items-center  gap-4 rounded-2xl border border-white/15 bg-black/35 backdrop-blur-md transition duration-300 hover:-translate-y-1.5 hover:border-gold hover:bg-black/50 hover:shadow-xl hover:shadow-gold/20"
            >

              <span className="flex flex-col gap-0.5">
                <span className="text-lg font-bold text-white">{t(`${s.key}Title`)}</span>
                <span className="text-sm leading-6 text-white/70">{t(`${s.key}Text`)}</span>
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ms-auto h-5 w-5 shrink-0 text-gold transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}