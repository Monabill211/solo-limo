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

const WHY = [
  {
    key: 'why1',
  },
  {
    key: 'why2',
  },
  {
    key: 'why3',
  },
  {
    key: 'why4',
  },
  {
    key: 'why5',
  },
  {
    key: 'why6',
  },
] as const;

const STEPS = [1, 2, 3, 4] as const;

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

export default function AboutPage() {
  const t = useTranslations('AboutPage');
  const brand = useTranslations('Brand');

  return (
    <div>
      {/* ---------- الهيدر بتاع الصفحة ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '5rem 4.5rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <span className="pointer-events-none absolute -bottom-24 end-1/4 -z-10 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />

        <div
          className="w-full max-w-4xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span className={badgeClass} style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}>
            {t('badge')}
          </span>

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

          <p className="max-w-2xl text-lg leading-9 text-white/75" style={{ marginInline: 'auto' }}>{t('intro')}</p>
        </div>
      </section>

      {/* ---------- قصتنا ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="grid w-full max-w-6xl  gap-12 md:grid-cols-2"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="flex flex-col gap-5">
            <span className={`${badgeClass} w-fit`} style={{ padding: '0.25rem 0.9rem' }}>
              {t('storyBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-gold md:text-4xl">{t('storyTitle')}</h2>
            <p className="leading-9 text-muted">{t('story1')}</p>
            <p className="leading-9 text-muted">{t('story2')}</p>
            <p className="leading-9 text-muted">{t('story3')}</p>
          </div>

          <div
            className="relative flex flex-col  gap-5 overflow-hidden rounded-3xl border border-line bg-linear-to-br from-navy-light to-navy text-center"
            style={{ padding: '3rem 2rem' }}
          >
            <span className="pointer-events-none absolute -top-16 -end-16 h-52 w-52 rounded-full bg-gold/20 blur-3xl" />
            <img
              src="/logo.png"
              alt={brand('name')}
              className="relative h-44 w-auto drop-shadow-[0_0_28px_rgba(201,162,39,0.45)]"
            />
            <p className="relative text-xl font-bold leading-9 text-gold-light">{t('quote')}</p>
          </div>
        </div>
      </section>

      {/* ---------- رسالتنا ورؤيتنا ---------- */}
      <section style={{ paddingBlock: '1rem 4.5rem' }}>
        <div
          className="grid w-full max-w-6xl gap-6 md:grid-cols-2"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {(['mission', 'vision'] as const).map((k) => (
            <div
              key={k}
              className="rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-gold/10"
              style={{ padding: '2.25rem 2rem' }}
            >
              <h3 className="text-2xl font-bold text-white" style={{ marginBlockEnd: '0.7rem' }}>
                {t(`${k}Title`)}
              </h3>
              <p className="leading-9 text-muted">{t(`${k}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- إيه اللي بنقدمه ---------- */}
      <section className="border-y border-line bg-navy-light/50" style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2.75rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('offerBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('offerTitle')}</h2>
            <p className="max-w-2xl text-muted" style={{ marginInline: 'auto', marginBlockStart: '0.7rem' }}>
              {t('offerSubtitle')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {SERVICES.map((s) => (
              <Link
                key={s.key}
                href={s.href}
                className="group flex flex-col gap-3 rounded-3xl border border-line border-t-gold/40 bg-navy transition duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-xl hover:shadow-gold/15"
                style={{ padding: '2rem 1.75rem' }}
              >
                <h3 className="text-xl font-bold text-white transition-colors group-hover:text-gold-light">
                  {t(`${s.key}Title`)}
                </h3>
                <p className="leading-8 text-muted">{t(`${s.key}Text`)}</p>
                <span className="flex gap-1.5 font-bold text-gold" style={{ marginBlockStart: 'auto' }}>
                  {t('discover')}
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 transition group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                  >
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- ليه سولو ليمو ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '2.75rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('whyBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('whyTitle')}</h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {WHY.map((w) => (
              <div
                key={w.key}
                className="flex gap-4 rounded-2xl border border-line bg-navy-light transition duration-300 hover:border-gold"
                style={{ padding: '1.5rem' }}
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-lg font-bold text-white">{t(`${w.key}Title`)}</h3>
                  <p className="leading-7 text-muted">{t(`${w.key}Text`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- الحجز بيتم إزاي ---------- */}
      <section className="border-y border-line bg-navy-light/50" style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div className="text-center" style={{ marginBlockEnd: '3rem' }}>
            <span className={badgeClass} style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}>
              {t('stepsBadge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('stepsTitle')}</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((n) => (
              <div
                key={n}
                className="relative rounded-3xl border border-line bg-navy text-center"
                style={{ padding: '2.5rem 1.5rem 2rem' }}
              >
                <span className="absolute -top-5 start-1/2 flex h-10 w-10 -translate-x-1/2  justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-lg font-extrabold text-navy shadow-lg shadow-gold/30 rtl:translate-x-1/2">
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

      {/* ---------- الدعوة للحجز ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <div
            className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy text-center shadow-2xl shadow-black/40"
            style={{ padding: '3.5rem 1.5rem' }}
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
              <Link
                href="/cars"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
              >
                {t('ctaBook')}
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.85rem 2.2rem' }}
                className="rounded-xl border border-white/25 bg-white/10 text-lg font-bold text-white transition hover:-translate-y-0.5 hover:border-[#25d366] hover:bg-[#25d366]"
              >
                {t('ctaWhatsapp')}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}