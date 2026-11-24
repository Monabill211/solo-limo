import { useTranslations } from 'next-intl';
import Link from 'next/link';

const PHONE = '+201044443195';
const WHATSAPP_URL = 'https://wa.me/201044443195';

const linkClass =
  'text-muted transition hover:translate-x-1 hover:text-gold-light rtl:hover:-translate-x-1';

export default function Footer() {
  const t = useTranslations('Footer');
  const h = useTranslations('Header');
  const brand = useTranslations('Brand');

  return (
    <footer
      className="border-t border-line bg-navy-light"
      style={{ marginBlockStart: '4rem', paddingBlockStart: '2.5rem' }}
    >
      <div
        className="grid w-full max-w-6xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]"
        style={{ marginInline: 'auto', paddingInline: '1rem' }}
      >
        <div className="flex flex-col gap-3">
          <img src="/logo.png" alt={brand('name')} className="h-20 w-auto self-start" />
          <p className="max-w-sm leading-8 text-muted">{t('about')}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-gold" style={{ marginBlockEnd: '0.4rem' }}>{t('services')}</h4>
          <Link href="/cars" className={linkClass}>{h('cars')}</Link>
          <Link href="/apartments" className={linkClass}>{h('apartments')}</Link>
          <Link href="/airport-guide" className={linkClass}>{h('airportGuide')}</Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-gold" style={{ marginBlockEnd: '0.4rem' }}>{t('quickLinks')}</h4>
          <Link href="/about" className={linkClass}>{h('about')}</Link>
          <Link href="/contact" className={linkClass}>{h('contact')}</Link>
          <Link href="/faq" className={linkClass}>{h('faq')}</Link>
          <Link href="/privacy" className={linkClass}>{h('privacy')}</Link>
        </div>

        <div className="flex flex-col gap-2.5">
          <h4 className="text-gold" style={{ marginBlockEnd: '0.4rem' }}>{t('contact')}</h4>
          <a href={`tel:${PHONE}`} dir="ltr" className={linkClass}>{PHONE}</a>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className={linkClass}>
            {t('whatsapp')}
          </a>
        </div>
      </div>

      <div
        className="w-full max-w-6xl border-t border-line text-center text-sm text-muted"
        style={{ marginInline: 'auto', marginBlockStart: '2.5rem', paddingBlock: '1.2rem', paddingInline: '1rem' }}
      >
© 2026 {brand('name')} — {t('rights')}      </div>

 

      <div
        className="w-full max-w-6xl border-t border-line text-center text-sm text-muted"
        style={{ marginInline: 'auto', marginBlockStart: '2.5rem', paddingBlock: '1.2rem', paddingInline: '1rem' }}
      >
        Developed by <a href="https://wa.me/201021219588" target="_blank" rel="noreferrer" className="bg-gold text-navy rounded-2xl font-bold" style={{ padding: '5px' }}>
          MoSalah
        </a>
      </div>
    </footer>
  );
}