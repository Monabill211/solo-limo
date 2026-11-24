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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* ---------- الجزء اللي فوق ---------- */}
      <div className="border-b border-line bg-navy">
        <div
          className="flex w-full max-w-6xl items-center justify-between gap-4"
          style={{ marginInline: 'auto', paddingInline: '1rem', paddingBlock: '0.6rem' }}
        >
          {/* زرار البرجر منيو (موبايل فقط) */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-gold transition-colors hover:border-gold-light md:hidden"
          >
            {mobileOpen ? (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* روابط الديسكتوب */}
          <nav className="hidden flex-wrap items-center gap-x-8 gap-y-1 text-lg font-medium md:flex">
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
                className="flex items-center gap-1.5 text-muted transition-colors hover:text-gold-light"
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

          <a href={`tel:${PHONE}`} dir="ltr" className="text-base font-bold text-gold md:text-lg">
            {PHONE}
          </a>
        </div>

        {/* قائمة الموبايل المنسدلة */}
        {mobileOpen && (
          <nav
            className="flex flex-col gap-1 border-t border-line bg-navy-light md:hidden"
            style={{ padding: '0.75rem 1rem' }}
          >
            <button
              type="button"
              aria-expanded={servicesOpen}
              onClick={() => setServicesOpen(!servicesOpen)}
              style={{ padding: '0.5rem 0.25rem' }}
              className="flex items-center justify-between text-base font-medium text-muted transition-colors hover:text-gold-light"
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

            {servicesOpen && (
              <div
                className="flex flex-col gap-1 border-s border-line"
                style={{ paddingInlineStart: '0.75rem', marginBlockEnd: '0.25rem' }}
              >
                {SERVICE_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => {
                      setServicesOpen(false);
                      setMobileOpen(false);
                    }}
                    style={{ padding: '0.45rem 0.25rem' }}
                    className="text-sm text-white/90 transition-colors hover:text-gold-light"
                  >
                    {t(l.key)}
                  </Link>
                ))}
              </div>
            )}

            {TOP_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                style={{ padding: '0.5rem 0.25rem' }}
                className="text-base font-medium text-muted transition-colors hover:text-gold-light"
              >
                {t(l.key)}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {/* ---------- الجزء اللي تحت ---------- */}
      <div
        className="border-b border-line bg-navy-light/90 backdrop-blur-md"
        style={{ paddingBlock: '0.6rem' }}
      >
        <div
          className="flex w-full max-w-6xl items-center justify-between gap-2 sm:gap-4"
          style={{ marginInline: 'auto', paddingInline: '1rem' }}
        >
          <Link href="/" aria-label={brand('name')} className="shrink-0">
            <img src="/logo.png" alt={brand('name')} className="block h-10 w-auto sm:h-14" />
          </Link>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-3">
            <CurrencySwitcher />
            <LanguageSwitcher />
            <HeaderAuth />
          </div>
        </div>
      </div>
    </header>
  );
}