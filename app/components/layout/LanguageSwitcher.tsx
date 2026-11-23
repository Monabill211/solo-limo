'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  function change(next: 'ar' | 'en') {
    if (next === locale) return;
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000`;
    router.refresh();
  }

  return (
    <div
      className="flex rounded-xl border border-line text-sm font-bold"
      style={{ padding: '0.15rem' }}
    >
      {([
        { code: 'ar', label: 'العربية' },
        { code: 'en', label: 'EN' },
      ] as const).map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => change(l.code)}
          style={{ padding: '0.25rem 0.7rem' }}
          className={`rounded-lg transition-colors ${
            locale === l.code ? 'bg-gold text-navy' : 'text-muted hover:text-gold-light'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}