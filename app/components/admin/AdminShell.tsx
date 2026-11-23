'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { t } from './ar';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';
  const router = useRouter();

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/admin/login');
    router.refresh();
  }
const ic = (path: React.ReactNode, size = 'h-5 w-5') => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={size}
  >
    {path}
  </svg>
);

const ICONS = {
  dashboard: ic(
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  bookings: ic(
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  cars: ic(
    <>
      <path d="M3 15l1.6-5.2A2 2 0 0 1 6.5 8.4h11a2 2 0 0 1 1.9 1.4L21 15" />
      <rect x="3" y="15" width="18" height="4" rx="1" />
      <circle cx="7" cy="17" r="0.6" />
      <circle cx="17" cy="17" r="0.6" />
    </>
  ),
  apartments: ic(
    <>
      <rect x="5" y="3" width="14" height="18" rx="1" />
      <path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2" />
    </>
  ),
  extras: ic(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  customers: ic(
    <>
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21c0-4 3-7 7-7s7 3 7 7" />
      <path d="M17 4a4 4 0 0 1 0 8M22 21c0-3-2-5.5-5-6.5" />
    </>
  ),
  discounts: ic(
    <>
      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.42 0l8.58-8.58a1 1 0 0 0 0-1.42z" />
      <path d="M7 7h.01" />
    </>
  ),
  finance: ic(
    <>
      <path d="M3 3v18h18" />
      <path d="m7 15 4-4 3 3 5-6" />
    </>
  ),
  airportGuide: ic(
    <>
      <path d="M21 3L3 10.5l6.5 2.5L12 21l9-18z" />
      <path d="M9.5 13L21 3" />
    </>
  ),
  settings: ic(
    <>
      <path d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  site: ic(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" />
    </>
  ),
  logout: ic(
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  menu: ic(<path d="M4 6h16M4 12h16M4 18h16" />, 'h-6 w-6'),
  close: ic(<path d="M18 6 6 18M6 6l12 12" />, 'h-6 w-6'),
};

const GROUPS = [
  {
    title: 'groupMain',
    items: [{ href: '/admin', key: 'dashboard' }],
  },
  {
    title: 'groupManage',
    items: [
      { href: '/admin/bookings', key: 'bookings' },
      { href: '/admin/cars', key: 'cars' },
      { href: '/admin/apartments', key: 'apartments' },
      { href: '/admin/extras', key: 'extras' },
      { href: '/admin/customers', key: 'customers' },
    ],
  },
  {
    title: 'groupMoney',
    items: [
      { href: '/admin/discounts', key: 'discounts' },
      { href: '/admin/finance', key: 'finance' },
    ],
  },
  {
    title: 'groupSite',
    items: [
      { href: '/admin/airport-guide', key: 'airportGuide' },
      { href: '/admin/settings', key: 'settings' },
    ],
  },
] as const;

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  // قفل القائمة لما الصفحة تتغير
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // منع سكرول الصفحة والقائمة مفتوحة على الموبايل + Esc للقفل
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);
  // صفحة الدخول من غير هيدر ولا قائمة
  if (pathname === '/admin/login') return <>{children}</>;
  return (
    // dir و lang ثابتين عربي بغض النظر عن لغة الموقع
    <div dir="rtl" lang="ar" className="min-h-screen bg-navy text-white">
      {/* ================= الهيدر ================= */}
      <header
        className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-line bg-navy-light/95 backdrop-blur-md"
        style={{ paddingInline: '1rem' }}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label={t('menu')}
            onClick={() => setOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-gold transition hover:border-gold lg:hidden"
          >
            {ICONS.menu}
          </button>

          <Link href="/admin" className="flex items-center gap-3">
            <img src="/logo.png" alt={t('brand')} className="h-10 w-auto" />
            <span
              className="hidden border-s border-line text-sm font-bold text-gold-light sm:block"
              style={{ paddingInlineStart: '0.75rem' }}
            >
              {t('panel')}
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            target="_blank"
            style={{ padding: '0.45rem 0.9rem' }}
            className="hidden items-center gap-2 rounded-xl border border-line text-sm font-bold text-muted transition hover:border-gold hover:text-gold-light md:flex"
          >
            {ICONS.site}
            {t('viewSite')}
          </Link>

          <div
            className="flex items-center gap-2.5 rounded-xl border border-line"
            style={{ padding: '0.25rem 0.6rem 0.25rem 0.35rem' }}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-sm font-extrabold text-navy">
              {t('adminName').charAt(0)}
            </span>
            <span className="hidden text-sm font-bold text-white sm:block">{t('adminName')}</span>
          </div>

          <button
            type="button"
            aria-label={t('logout')}
            title={t('logout')}
            // TODO: supabase.auth.signOut() لما نربط الدخول
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:border-red-400 hover:text-red-400"
          >
            {ICONS.logout}
          </button>
        </div>
      </header>

      <div className="lg:grid lg:grid-cols-[16rem_1fr]">
        {/* خلفية تغميق على الموبايل */}
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
            open ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        />

        {/* ================= القائمة الجانبية (على اليمين) ================= */}
        <aside
          className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col overflow-y-auto border-l border-line bg-navy-light transition-transform duration-300 ease-out lg:sticky lg:inset-y-auto lg:top-16 lg:z-10 lg:h-[calc(100vh-4rem)] lg:w-auto lg:translate-x-0 ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ padding: '1rem' }}
        >
          {/* رأس القائمة على الموبايل */}
          <div className="flex items-center justify-between lg:hidden" style={{ marginBlockEnd: '1.25rem' }}>
            <img src="/logo.png" alt={t('brand')} className="h-11 w-auto" />
            <button
              type="button"
              aria-label={t('close')}
              onClick={() => setOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-gold"
            >
              {ICONS.close}
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-5">
            {GROUPS.map((g) => (
              <div key={g.title} className="flex flex-col gap-1">
                <p
                  className="text-xs font-bold text-muted/70"
                  style={{ paddingInline: '0.75rem', marginBlockEnd: '0.3rem' }}
                >
                  {t(g.title)}
                </p>

                {g.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={{ padding: '0.65rem 0.75rem' }}
                      className={`relative flex items-center gap-3 rounded-xl font-bold transition ${
                        active
                          ? 'bg-gold/15 text-gold-light'
                          : 'text-muted hover:bg-navy hover:text-white'
                      }`}
                    >
                      {active && (
                        <span className="absolute inset-y-2 right-0 w-1 rounded-full bg-gold" />
                      )}
                      <span className={active ? 'text-gold' : ''}>
                        {ICONS[item.key as keyof typeof ICONS]}
                      </span>
                      {t(item.key)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <Link
            href="/"
            target="_blank"
            style={{ padding: '0.7rem 0.75rem', marginBlockStart: '1.5rem' }}
            className="flex items-center gap-3 rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light md:hidden"
          >
            {ICONS.site}
            {t('viewSite')}
          </Link>
        </aside>

        {/* ================= المحتوى ================= */}
        <main className="min-w-0" style={{ padding: 'clamp(1rem, 2.5vw, 2rem)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}