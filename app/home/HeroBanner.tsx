// الاستخدام: <HeroAboutSection />
// حط صورة الخلفية في: public/hero.jpg  (لو مش موجودة بيظهر تدرّج كحلي)

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const WHATSAPP_URL = 'https://wa.me/201044443195';

const icon = (path: React.ReactNode) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    {path}
  </svg>
);

// غيّر الروابط دي لصفحاتك، والرابط الفاضي ('') بيشيل الأيقونة
const SOCIAL = [
  {
    key: 'Facebook',
    href: 'https://facebook.com/',
    svg: icon(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />),
  },
  {
    key: 'Instagram',
    href: 'https://instagram.com/',
    svg: icon(
      <>
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <path d="M17.5 6.5h.01" />
      </>
    ),
  },
  {
    key: 'TikTok',
    href: 'https://tiktok.com/',
    svg: icon(
      <>
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </>
    ),
  },
  {
    key: 'Telegram',
    href: 'https://t.me/',
    svg: icon(
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
  },
].filter((s) => s.href);

const socialClass =
  'flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur transition hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-navy';

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
    >
      {s.svg}
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
        {/* شريط السوشيال على الجنب (الشاشات الكبيرة) */}
        <div className="absolute end-5 top-1/2 hidden -translate-y-1/2 flex-col gap-3 md:flex">
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
          <div className="flex gap-3 md:hidden" style={{ marginBlockStart: '1.75rem' }}>
            {socials}
          </div>
        </div>
      </div>

      
    </section>
  );
}