'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addDays, toISO, todayISO } from '@/app/lib/dates';

export type Busy = { start: string; end: string }; // end = يوم الرجوع (مش محسوب)

export default function RangeCalendar({
  busy,
  start,
  end,
  onChange,
}: {
  busy: Busy[];
  start: string | null;
  end: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const t = useTranslations('Booking');
  const loc = useLocale() === 'ar' ? 'ar-EG' : 'en-US';

  const today = todayISO();
  const [ty, tm] = today.split('-').map(Number);
  const [view, setView] = useState({ y: ty, m: tm - 1 });

  const taken = (iso: string) => busy.some((b) => iso >= b.start && iso < b.end);

  const rangeFree = (a: string, b: string) => {
    for (let d = a; d < b; d = addDays(d, 1)) if (taken(d)) return false;
    return true;
  };

  const selectingEnd = !!start && !end;

  const isDisabled = (iso: string) => {
    if (selectingEnd && iso > start!) return !rangeFree(start!, iso);
    return iso < today || taken(iso);
  };

  function pick(iso: string) {
    if (isDisabled(iso)) return;
    if (selectingEnd && iso > start!) onChange(start, iso);
    else onChange(iso, null);
  }

  // شبكة الشهر (السبت أول يوم في الأسبوع)
  const first = new Date(Date.UTC(view.y, view.m, 1));
  const offset = (first.getUTCDay() + 1) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISO(view.y, view.m, i + 1)),
  ];

  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Intl.DateTimeFormat(loc, { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2023, 0, 7 + i)) // 7 يناير 2023 = سبت
    )
  );

  const monthLabel = new Intl.DateTimeFormat(loc, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(first);

  const isCurrentMonth = view.y === ty && view.m === tm - 1;

  const move = (n: number) =>
    setView((v) => {
      const d = new Date(Date.UTC(v.y, v.m + n, 1));
      return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
    });

  const nav =
    'min-h-10 rounded-xl border border-line text-xs font-semibold text-gold transition hover:border-gold disabled:opacity-30 disabled:hover:border-line';

  return (
    <div className="rounded-2xl border border-line bg-navy" style={{ padding: '1rem' }}>
      <div className="flex flex-wrap items-center justify-between gap-2" style={{ marginBlockEnd: '1rem' }}>
        <button type="button" onClick={() => move(-1)} disabled={isCurrentMonth} aria-label={t('prevMonth')} className={nav} style={{ paddingInline: '0.5rem' }}>
          {t('prevMonth')}
        </button>
        <p className="font-bold text-white">{monthLabel}</p>
        <button type="button" onClick={() => move(1)} aria-label={t('nextMonth')} className={nav} style={{ paddingInline: '0.5rem' }}>
          {t('nextMonth')}
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted" style={{ marginBlockEnd: '0.5rem' }}>
        {weekdays.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`e${i}`} />;

          const disabled = isDisabled(iso);
          const isStart = iso === start;
          const isEnd = iso === end;
          const inRange = !!start && !!end && iso > start && iso < end;
          const busyDay = taken(iso);

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => pick(iso)}
              className={`flex aspect-square items-center justify-center rounded-lg text-sm font-bold transition ${
                isStart || isEnd
                  ? 'bg-gold text-navy shadow-md shadow-gold/30'
                  : inRange
                    ? 'bg-gold/20 text-gold-light'
                    : busyDay
                      ? 'cursor-not-allowed bg-red-500/10 text-red-300/50 line-through'
                      : disabled
                        ? 'cursor-not-allowed text-muted/30'
                        : 'text-white hover:bg-gold/20 hover:text-gold-light'
              }`}
            >
              {Number(iso.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted" style={{ marginBlockStart: '1rem' }}>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-gold" /> {t('legendSelected')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-red-500/30" /> {t('legendBusy')}
        </span>
      </div>
    </div>
  );
}