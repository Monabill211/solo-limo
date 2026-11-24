// الاستخدام: <ReviewsSection />
// الكروت بتتحرك لوحدها، ولما تقف عليها بالماوس بتقف
// الكلام من ملفات اللغة (قسم Reviews: r1 لحد r6)

import { useLocale, useTranslations } from 'next-intl';

const ITEMS = [1, 2, 3, 4, 5, 6];

const Star = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-gold text-gold">
    <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5 7.5-.7z" />
  </svg>
);

export default function ReviewsSection() {
  const t = useTranslations('Reviews');
  const dir = useLocale() === 'ar' ? 'rtl' : 'ltr';

  // الكروت مكررة مرتين عشان الحركة تلف من غير ما تقطع
  const loop = [...ITEMS, ...ITEMS];

  return (
<section 
style={{ paddingBlock: '4.5rem' }}
      className="relative isolate flex flex-col justify-between overflow-hidden bg-navy"
 >    
   <style>{`
        @keyframes reviews-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .reviews-track {
          animation: reviews-scroll 45s linear infinite;
        }
        .reviews-wrap:hover .reviews-track {
          animation-play-state: paused;
        }
      `}</style>

      <div
        className="w-full max-w-6xl text-center"
        style={{ marginInline: 'auto', paddingInline: '1rem', marginBlockEnd: '2.75rem' }}
      >
        <span
          className="inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
          style={{ padding: '0.25rem 0.9rem', marginBlockEnd: '0.9rem' }}
        >
          {t('badge')}
        </span>
        <h2 className="text-3xl font-extrabold text-white md:text-4xl">{t('title')}</h2>
        <p className="text-muted" style={{ marginBlockStart: '0.6rem' }}>
          {t('subtitle')}
        </p>
      </div>

      {/* الحركة دايماً في اتجاه واحد، والكلام جوه الكروت بيتبع لغة الموقع */}
      <div
        dir="ltr"
        className="reviews-wrap w-full max-w-full overflow-hidden"        style={{
          maskImage: 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)',
        }}
      >
        <div className="reviews-track flex w-max">
          {loop.map((n, i) => (
            <article
              key={i}
              dir={dir}
              style={{ padding: '1.7rem', marginRight: '1.25rem' }}
              className="flex w-80 shrink-0 flex-col gap-4 rounded-3xl border border-line bg-navy-light transition-colors duration-300 hover:border-gold md:w-96"
            >
              <div className="flex  justify-between">
                <div className="flex gap-1">
                  {[0, 1, 2, 3, 4].map((s) => (
                    <Star key={s} />
                  ))}
                </div>
                <span className="text-5xl font-extrabold leading-none text-gold/30">”</span>
              </div>

              <p className="leading-8 text-white/85">{t(`r${n}`)}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}