// الاستخدام: <HeroAboutSection />
// حط صورة الخلفية في: public/hero.jpg  (لو مش موجودة بيظهر تدرّج كحلي)

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';

// غيّر الروابط دي لصفحاتك، والرابط الفاضي ('') بيشيل الأيقونة
const SOCIAL = [
  {
    key: 'Facebook',
    href: 'https://facebook.com/',
  },
  {
    key: 'Instagram',
    href: 'https://instagram.com/',
  },
  {
    key: 'TikTok',
    href: 'https://tiktok.com/',
  },
  {
    key: 'Telegram',
    href: 'https://t.me/',
  },
].filter((s) => s.href);

const socialClass =
  'flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-navy';

export default function HeroAboutSection() {
  const tHero = useTranslations('Hero');
  const tAbout = useTranslations('About');

  const socials = SOCIAL.map((s) => (
    <a
      key={s.key}
      href={s.href}
      target="_blank"
      rel="noreferrer"
      aria-label={s.key}
      className={socialClass}
      style={{ paddingInline: '0.75rem' }}
    >
      {s.key}
    </a>
  ));

  return (
    <section
      className="relative isolate flex flex-col justify-between overflow-hidden bg-navy"
      style={{
        backgroundImage:"linear-gradient(to top, rgb(11 18 32 / 0.98) 15%, rgb(11 18 32 / 0.7) 55%, rgb(11 18 32 / 0.4))"
   
      }}
    >

      {/* إضاءة خلفية جمالية */}
      <span className="pointer-events-none absolute -bottom-32 start-1/4 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
{/* ================= الجزء الثاني: About (مدمج في نفس السكشن) ================= */}
      <div
        className="relative border-t border-white/10 bg-navy/40 backdrop-blur-xs"
        style={{ paddingBlock: '4rem' }}
      >
        <div
          className="w-full max-w-3xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span
            className="inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light"
        
          >
            {tAbout('badge')}
          </span>

          <h2
            className="text-3xl font-extrabold text-gold md:text-4xl"
          >
            {tAbout('title')}
          </h2>

          <p className="text-lg leading-9 text-white/80">{tAbout('text')}</p>

          <span
            className="mx-auto block h-0.5 w-20 rounded-full bg-linear-to-r from-transparent via-gold to-transparent"
      
          />
        </div>
      </div>
      {/* ================= الجزء الأول: Hero ================= */}
      <div className="relative flex items-end">
        {/* روابط التواصل على الشاشات الكبيرة */}
        <div className="absolute z-10 end-5 top-1/2 hidden -translate-y-1/2 flex-col gap-3 lg:flex">
          {socials}
        </div>

        <div
          className="relative w-full max-w-6xl"
          style={{ marginInline: 'auto', paddingInline: '1rem', paddingBlock: '4.5rem 3rem' }}
        >
          <span
            className="inline-block rounded-full border border-gold/50 bg-black/30 text-sm font-bold text-gold-light backdrop-blur"
            style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}
          >
            {tHero('badge')}
          </span>

          <h1
            className="max-w-3xl text-4xl font-extrabold leading-tight text-white md:text-6xl"
            style={{ marginBlockEnd: '1.1rem' }}
          >
            {tHero.rich('title', {
              g: (chunks) => (
                <span className="bg-linear-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>

          <p
            className="max-w-xl text-lg leading-8 text-white/80"
            style={{ marginBlockEnd: '2rem' }}
          >
            {tHero('text')}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/cars"
              style={{ padding: '0.8rem 2rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {tHero('book')}
            </Link>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              style={{ padding: '0.8rem 2rem' }}
              className="rounded-xl border border-white/25 bg-white/10 font-bold text-white backdrop-blur transition hover:-translate-y-0.5 hover:border-[#25d366] hover:bg-[#25d366]"
            >
              {tHero('whatsapp')}
            </a>
          </div>

          <div className="flex flex-wrap gap-2.5" style={{ marginBlockStart: '2rem' }}>
            {(['chip1', 'chip2', 'chip3'] as const).map((k) => (
              <span
                key={k}
                className="rounded-full border border-white/15 bg-black/30 text-sm text-white/85 backdrop-blur"
                style={{ padding: '0.35rem 1rem' }}
              >
                {tHero(k)}
              </span>
            ))}
          </div>

          {/* السوشيال على الموبايل */}
          <div className="flex flex-wrap gap-3 lg:hidden" style={{ marginBlockStart: '1.75rem' }}>
            {socials}
          </div>
        </div>
      </div>

      
    </section>
  );
}
