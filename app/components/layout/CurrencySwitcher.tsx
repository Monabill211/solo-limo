'use client';

import { useCurrency } from '../../providers/CurrencyProvider';

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div
      className="flex rounded-xl border border-line text-sm font-bold"
      style={{ padding: '0.15rem' }}
    >
      {(['EGP', 'USD'] as const).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => setCurrency(c)}
          style={{ padding: '0.25rem 0.7rem' }}
          className={`rounded-lg transition-colors ${
            currency === c ? 'bg-gold text-navy' : 'text-muted hover:text-gold-light'
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}