'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

const PHONE = '+201044443195';
const WHATSAPP_URL = 'https://wa.me/201044443195';

const icon = (path: React.ReactNode, size = 'h-6 w-6') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
  >
    {path}
  </svg>
);

// غيّر الروابط دي لصفحاتك، والرابط الفاضي ('') بيشيل الأيقونة
const SOCIAL = [
  { key: 'Facebook', href: 'https://facebook.com/', svg: icon(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />, 'h-5 w-5') },
  { key: 'Instagram', href: 'https://instagram.com/', svg: icon(<><rect x="2" y="2" width="20" height="20" rx="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><path d="M17.5 6.5h.01" /></>, 'h-5 w-5') },
  { key: 'TikTok', href: 'https://tiktok.com/', svg: icon(<><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>, 'h-5 w-5') },
  { key: 'Telegram', href: 'https://t.me/', svg: icon(<><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>, 'h-5 w-5') },
].filter((s) => s.href);

const SUBJECTS = ['booking', 'cars', 'apartments', 'airport', 'other'] as const;

const badgeClass =
  'inline-block rounded-full border border-gold/40 bg-gold/10 text-sm font-bold text-gold-light';

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

export default function ContactPage() {
  const t = useTranslations('ContactPage');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('booking');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // مفيش سيرفر لسه، فالنموذج بيفتح واتساب والرسالة جاهزة
  function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    const text = [
      t('waIntro'),
      `${t('name')}: ${name}`,
      `${t('phone')}: ${phone}`,
      `${t('subject')}: ${t(`subject_${subject}`)}`,
      '',
      message,
    ].join('\n');

    window.open(`${WHATSAPP_URL}?text=${encodeURIComponent(text)}`, '_blank');
    setSent(true);
  }

  return (
    <div>
      {/* ---------- الهيدر ---------- */}
      <section
        className="relative isolate overflow-hidden border-b border-line"
        style={{ paddingBlock: '4.5rem 4rem' }}
      >
        <div className="absolute inset-0 -z-10 bg-linear-to-b from-navy-light to-navy" />
        <span className="pointer-events-none absolute -top-24 start-1/4 -z-10 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />

        <div
          className="w-full max-w-3xl text-center"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <span className={badgeClass} style={{ padding: '0.3rem 1rem', marginBlockEnd: '1.25rem' }}>
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

          <p className="text-lg leading-9 text-white/75">{t('intro')}</p>
        </div>
      </section>

      {/* ---------- طرق التواصل + النموذج ---------- */}
      <section style={{ paddingBlock: '4.5rem' }}>
        <div
          className="grid w-full max-w-6xl items-start gap-8 lg:grid-cols-[1fr_1.4fr]"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          {/* ----- الجنب: الكروت ----- */}
          <div className="flex flex-col gap-5">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-1 hover:border-[#25d366] hover:shadow-xl hover:shadow-[#25d366]/15"
              style={{ padding: '1.5rem' }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25d366]/15 text-[#25d366] transition group-hover:bg-[#25d366] group-hover:text-white">
                {icon(
                  <>
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                    <path d="M9 10c.5 2 2 3.5 4 4l1.3-1.2 2 1-.5 1.3c-2.8.6-6.3-2.9-6.8-6.1l1.3-.5 1 2z" />
                  </>,
                  'h-7 w-7'
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-lg font-bold text-white">{t('whatsappTitle')}</span>
                <span className="text-sm text-muted">{t('whatsappText')}</span>
              </span>
            </a>

            <a
              href={`tel:${PHONE}`}
              className="group flex items-center gap-4 rounded-3xl border border-line bg-navy-light transition duration-300 hover:-translate-y-1 hover:border-gold hover:shadow-xl hover:shadow-gold/15"
              style={{ padding: '1.5rem' }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold transition group-hover:bg-gold group-hover:text-navy">
                {icon(
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
                  'h-7 w-7'
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-lg font-bold text-white">{t('phoneTitle')}</span>
                <span dir="ltr" className="text-start text-gold-light">
                  {PHONE}
                </span>
              </span>
            </a>

            {SOCIAL.length > 0 && (
              <div
                className="rounded-3xl border border-line bg-navy-light"
                style={{ padding: '1.5rem' }}
              >
                <p className="text-lg font-bold text-white" style={{ marginBlockEnd: '1rem' }}>
                  {t('followTitle')}
                </p>
                <div className="flex flex-wrap gap-3">
                  {SOCIAL.map((s) => (
                    <a
                      key={s.key}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={s.key}
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-line text-gold transition hover:-translate-y-1 hover:border-gold hover:bg-gold hover:text-navy"
                    >
                      {s.svg}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div
              className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/5 text-sm leading-7 text-white/80"
              style={{ padding: '1.1rem 1.25rem' }}
            >
              <span className="mt-1 h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[#25d366]" />
              {t('responseNote')}
            </div>
          </div>

          {/* ----- النموذج ----- */}
          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-5 rounded-3xl border border-line bg-navy-light shadow-xl shadow-black/30"
            style={{ padding: '2rem 1.75rem' }}
          >
            <div>
              <h2 className="text-2xl font-extrabold text-gold" style={{ marginBlockEnd: '0.4rem' }}>
                {t('formTitle')}
              </h2>
              <p className="text-muted">{t('formText')}</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white/85">{t('name')}</span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  style={{ padding: '0.8rem 1rem' }}
                  className={inputClass}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white/85">{t('phone')}</span>
                <input
                  required
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+20 10 0000 0000"
                  style={{ padding: '0.8rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </label>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold text-white/85">{t('subject')}</span>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSubject(s)}
                    style={{ padding: '0.45rem 1.1rem' }}
                    className={`rounded-full border text-sm font-bold transition ${
                      subject === s
                        ? 'border-gold bg-gold text-navy shadow-md shadow-gold/30'
                        : 'border-line text-muted hover:border-gold hover:text-gold-light'
                    }`}
                  >
                    {t(`subject_${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-white/85">{t('message')}</span>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t('messagePlaceholder')}
                style={{ padding: '0.8rem 1rem' }}
                className={`${inputClass} resize-y`}
              />
            </label>

            <button
              type="submit"
              style={{ padding: '0.9rem 1.5rem' }}
              className="flex items-center justify-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('send')}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 rtl:-scale-x-100"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </button>

            {sent && (
              <p className="rounded-xl border border-[#25d366]/40 bg-[#25d366]/10 text-center text-[#6ee7a0]" style={{ padding: '0.8rem 1rem' }}>
                {t('sent')}
              </p>
            )}

            <p className="text-center text-sm text-muted">{t('formNote')}</p>
          </form>
        </div>
      </section>

      {/* ---------- رابط الأسئلة الشائعة ---------- */}
      <section style={{ paddingBlock: '0 4.5rem' }}>
        <div
          className="w-full max-w-4xl"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <Link
            href="/faq"
            className="group flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-line bg-navy-light transition duration-300 hover:border-gold hover:shadow-xl hover:shadow-gold/10"
            style={{ padding: '1.75rem' }}
          >
            <span className="flex flex-col gap-1">
              <span className="text-xl font-bold text-white">{t('faqTitle')}</span>
              <span className="text-muted">{t('faqText')}</span>
            </span>
            <span className="flex items-center gap-2 font-bold text-gold">
              {t('faqButton')}
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
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}