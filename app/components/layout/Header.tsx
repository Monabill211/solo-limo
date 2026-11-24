'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import HeaderAuth from './HeaderAuth';
import LanguageSwitcher from './LanguageSwitcher';
import CurrencySwitcher from './CurrencySwitcher';

const PHONE = '+201044443195';

const TOP_LINKS = [
  { href: '/About', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/faq', key: 'faq' },
  { href: '/privacy', key: 'privacy' },
] as const;

const SERVICE_LINKS = [
  { href: '/cars', key: 'cars' },
  { href: '/apartments', key: 'apartments' },
  { href: '/airport-guide', key: 'airportGuide' },
] as const;

export default function Header() {
  const t = useTranslations('Header');
  const brand = useTranslations('Brand');
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* ---------- الجزء اللي فوق ---------- */}
      <div className="border-b border-line bg-navy">
        <div
          className="flex w-full max-w-6xl flex-wrap  justify-between gap-x-8 gap-y-2"
          style={{ marginInline: 'auto', paddingInline: '1rem', paddingBlock: '0.6rem' }}
        >
          <nav className="flex flex-wrap  gap-x-8 gap-y-1 text-lg font-medium">
            {/* الخدمات مع السهم */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <button
                type="button"
                aria-expanded={servicesOpen}
                onClick={() => setServicesOpen(!servicesOpen)}
                className="flex  gap-1.5 text-muted transition-colors hover:text-gold-light"
              >
                {t('services')}
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`h-4 w-4 transition-transform duration-300 ${servicesOpen ? 'rotate-180' : ''}`}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              <div
                className={`${servicesOpen ? 'flex' : 'hidden'} absolute start-0 top-full z-50 min-w-52 flex-col rounded-xl border border-line bg-navy-light shadow-xl shadow-black/40`}
                style={{ paddingBlock: '0.5rem' }}
              >
                {SERVICE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setServicesOpen(false)}
                    style={{ padding: '0.6rem 1.1rem' }}
                    className="text-base text-white transition-colors hover:bg-navy hover:text-gold-light"
                  >
                    {t(l.key)}
                  </Link>
                ))}
              </div>
            </div>

            {TOP_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-muted transition-colors hover:text-gold-light"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>

          <a href={`tel:${PHONE}`} dir="ltr" className="text-lg font-bold text-gold">
            {PHONE}
          </a>
        </div>
      </div>

      {/* ---------- الجزء اللي تحت ---------- */}
      <div
        className="border-b border-line bg-navy-light/90 backdrop-blur-md"
        style={{ paddingBlock: '0.75rem' }}
      >
        <div
          className="flex w-full max-w-6xl  justify-between gap-4"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <Link href="/" aria-label={brand('name')}>
            <img src="/logo.png" alt={brand('name')} className="block h-14 w-auto" />
          </Link>

          <div className="flex flex-wrap  justify-end gap-3">
            <CurrencySwitcher />
            <LanguageSwitcher />

            {/* <Link
              href="/login"
              className="hidden text-muted transition-colors hover:text-gold-light md:block"
            >
              {t('login')}
            </Link>

            <Link
              href="/login?mode=signup"
              style={{ padding: '0.5rem 1.4rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
            >
              {t('signup')}
            </Link> */}
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}