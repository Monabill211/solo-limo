// الاستخدام: <BlogSection />
// صور المقالات: حطها في  public/blog/1.jpg  و  2.jpg  و  3.jpg
// (لو الصورة مش موجودة بيظهر تدرّج كحلي مكانها)

import Link from 'next/link';
import { useTranslations } from 'next-intl';

const POSTS = [
  { n: 1, slug: 'airport-arrival-guide', minutes: 5 },
  { n: 2, slug: 'car-rental-tips', minutes: 4 },
  { n: 3, slug: 'hotel-apartment-guide', minutes: 4 },
] as const;

const bg = (n: number) => ({
  backgroundImage: `url('/blog/${n}.jpg'), linear-gradient(135deg, #1c2943, #0b1220)`,
});

const Arrow = () => (
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
);

export default function BlogSection() {
  const t = useTranslations('Blog');
  const [main, ...rest] = POSTS;

  return (
    <section style={{ paddingBlock: '4.5rem' }}>
      <div
        className="w-full max-w-6xl"
        style={{ marginInline: 'auto', paddingInline: '1rem' }}
      >
        {/* ---------- العنوان ---------- */}
        <div
          className="flex flex-wrap items-end justify-between gap-4"
          style={{ marginBlockEnd: '2.5rem' }}
        >
          <div>
            <span
              className="inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
              style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.8rem' }}
            >
              {t('badge')}
            </span>
            <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('title')}</h2>
            <p className="max-w-xl text-muted" style={{ marginBlockStart: '0.6rem' }}>
              {t('subtitle')}
            </p>
          </div>

          <Link
            href="/blog"
            style={{ padding: '0.55rem 1.4rem' }}
            className="group flex  gap-2 rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
          >
            {t('viewAll')}
            <Arrow />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* ---------- المقال الكبير ---------- */}
          <Link
            href={`/blog/${main.slug}`}
            className="group relative flex min-h-[26rem] items-end overflow-hidden rounded-3xl border border-line md:row-span-2"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-105"
              style={bg(main.n)}
            />
            <div className="absolute inset-0 bg-linear-to-t from-navy via-navy/60 to-transparent" />

            <div className="relative flex flex-col gap-3" style={{ padding: '1.75rem' }}>
              <span
                className="w-fit rounded-full bg-gold font-bold text-navy"
                style={{ padding: '0.2rem 0.85rem', fontSize: '0.8rem' }}
              >
                {t(`p${main.n}Category`)}
              </span>
              <h3 className="text-2xl font-extrabold leading-snug text-white md:text-3xl">
                {t(`p${main.n}Title`)}
              </h3>
              <p className="max-w-md leading-7 text-white/75">{t(`p${main.n}Excerpt`)}</p>
              <div className="flex  gap-4 text-sm text-gold-light">
                <span>{t('minutes', { n: main.minutes })}</span>
                <span className="flex  gap-1.5 font-bold">
                  {t('read')}
                  <Arrow />
                </span>
              </div>
            </div>
          </Link>

          {/* ---------- المقالات الصغيرة ---------- */}
          {rest.map((p) => (
            <Link
              key={p.n}
              href={`/blog/${p.slug}`}
              className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-1.5 hover:border-gold hover:shadow-xl hover:shadow-gold/15 sm:flex-row"
            >
              <div className="relative min-h-44 overflow-hidden sm:w-2/5">
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
                  style={bg(p.n)}
                />
              </div>

              <div className="flex flex-1 flex-col gap-2.5" style={{ padding: '1.4rem' }}>
                <span className="text-sm font-bold text-gold">{t(`p${p.n}Category`)}</span>
                <h3 className="text-xl font-bold leading-snug text-white transition-colors group-hover:text-gold-light">
                  {t(`p${p.n}Title`)}
                </h3>
                <p className="leading-7 text-muted">{t(`p${p.n}Excerpt`)}</p>
                <div className="mt-auto flex  justify-between text-sm text-muted">
                  <span>{t('minutes', { n: p.minutes })}</span>
                  <span className="flex  gap-1.5 font-bold text-gold">
                    {t('read')}
                    <Arrow />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}