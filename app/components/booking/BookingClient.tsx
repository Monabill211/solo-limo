'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/app/lib/supabase/client';
import { useCurrency } from '@/app/providers/CurrencyProvider';
import { computeTotals } from '@/app/lib/pricing';
import { diffDays } from '@/app/lib/dates';
import RangeCalendar, { type Busy } from './RangeCalendar';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Kind = 'car' | 'apartment';

type Item = {
  id: string;
  name_ar: string;
  name_en: string;
  images: string[] | null;
  price_egp: number;
  price_usd: number;
};

type Extra = {
  id: string;
  name_ar: string;
  name_en: string;
  price_egp: number;
  price_usd: number;
  per_day: boolean;
  applies_to: Kind | null;
};

type Discount = { code: string; type: 'percent' | 'fixed'; value: number; rate: number };

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted/60 transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

function Card({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-navy-light" style={{ padding: '1.4rem' }}>
      <div className="flex items-start gap-3" style={{ marginBlockEnd: '1.1rem' }}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light font-extrabold text-navy">
          {n}
        </span>
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
          {hint && <p className="text-sm text-muted">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export default function BookingClient({ type, id }: { type: Kind; id: string }) {
  const t = useTranslations('Booking');
  const isAr = useLocale() === 'ar';
  const { currency } = useCurrency();
  const isCar = type === 'car';

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [item, setItem] = useState<Item | null>(null);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [busy, setBusy] = useState<Busy[]>([]);
  const [loggedIn, setLoggedIn] = useState(false);

  const [start, setStart] = useState<string | null>(null);
  const [end, setEnd] = useState<string | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [codeMsg, setCodeMsg] = useState('');
  const [codeBusy, setCodeBusy] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<null | { paymentError: boolean; paid: boolean }>(null);

  /* ---------- تحميل البيانات ---------- */
  useEffect(() => {
    let alive = true;

    (async () => {
      const supabase = createClient();

      const { data: it } = await supabase
        .from(isCar ? 'cars' : 'apartments')
        .select('id, name_ar, name_en, images, price_egp, price_usd')
        .eq('id', id)
        .eq('active', true)
        .maybeSingle();

      if (!alive) return;
      if (!it) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setItem({ ...it, price_egp: Number(it.price_egp), price_usd: Number(it.price_usd) } as Item);

      const [ex, busyRes, auth] = await Promise.all([
        supabase.from('extras').select('*').eq('active', true).order('created_at'),
        supabase.rpc('busy_ranges', { p_type: type, p_id: id }),
        supabase.auth.getUser(),
      ]);

      if (!alive) return;

      setExtras(
        ((ex.data ?? []) as any[])
          .filter((e) => !e.applies_to || e.applies_to === type)
          .map((e) => ({ ...e, price_egp: Number(e.price_egp), price_usd: Number(e.price_usd) }))
      );
      setBusy(((busyRes.data ?? []) as any[]).map((b) => ({ start: b.start_date, end: b.end_date })));

      const user = auth.data.user;
      setLoggedIn(!!user);

      if (user) {
        const { data: p } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', user.id)
          .maybeSingle();
        if (alive) {
          setName(p?.full_name ?? '');
          setPhone(p?.phone ?? '');
        }
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [id, type, isCar]);

  /* ---------- الحساب (معاينة، والسيرفر بيعيده تاني) ---------- */
  const days = start && end ? diffDays(start, end) : 0;
  const unit = item ? (currency === 'EGP' ? item.price_egp : item.price_usd) : 0;
  const chosen = extras.filter((e) => picked.includes(e.id));

  const totals = useMemo(
    () =>
      computeTotals({
        unit,
        days,
        currency,
        rate: discount?.rate ?? 50,
        extras: chosen.map((e) => ({
          price: currency === 'EGP' ? e.price_egp : e.price_usd,
          perDay: e.per_day,
        })),
        discount: discount ? { type: discount.type, value: discount.value } : null,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [unit, days, currency, picked, discount, extras]
  );

  const fmt = (n: number) =>
    new Intl.NumberFormat(isAr ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);

  const toggleExtra = (eid: string) =>
    setPicked((p) => (p.includes(eid) ? p.filter((x) => x !== eid) : [...p, eid]));

  const errText = (e: string) => (t.has(`err_${e}`) ? t(`err_${e}`) : t('err_generic'));

  /* ---------- كود الخصم ---------- */
  async function applyCode() {
    if (!code.trim()) return;
    setCodeBusy(true);
    setCodeMsg('');

    try {
      const res = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDiscount(null);
        setCodeMsg(errText(data.error));
      } else {
        setDiscount({ code: data.code, type: data.type, value: data.value, rate: data.rate });
      }
    } catch {
      setCodeMsg(t('err_generic'));
    }
    setCodeBusy(false);
  }

  /* ---------- تأكيد الحجز ---------- */
  async function submit() {
    if (!item || !start || !end) return;
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          itemId: item.id,
          start,
          end,
          currency,
          extraIds: picked,
          code: discount?.code ?? '',
          name,
          phone,
          notes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(errText(data.error));
        setSubmitting(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setDone({ paymentError: !!data.paymentError, paid: !!data.paid });
    } catch {
      setError(t('err_generic'));
    }
    setSubmitting(false);
  }

  const canSubmit = loggedIn && days > 0 && name.trim().length >= 2 && phone.replace(/\D/g, '').length >= 8;
  const itemName = item ? (isAr ? item.name_ar : item.name_en) : '';
  const backHref = isCar ? '/cars' : '/apartments';
  const returnTo = `/booking?type=${type}&id=${id}`;
  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(returnTo)}`;

  /* ---------- الحالات الخاصة ---------- */
  if (loading) {
    return (
      <div className="w-full max-w-6xl" style={{ marginInline: 'auto', padding: '3rem 1rem' }}>
        <div className="h-64 animate-pulse rounded-3xl border border-line bg-navy-light" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="text-center" style={{ padding: '5rem 1rem' }}>
        <p className="text-2xl font-bold text-white" style={{ marginBlockEnd: '0.6rem' }}>
          {t('notFoundTitle')}
        </p>
        <p className="text-muted" style={{ marginBlockEnd: '1.5rem' }}>{t('notFoundText')}</p>
        <Link href={backHref} style={{ padding: '0.7rem 1.8rem' }} className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy">
          {isCar ? t('backCars') : t('backApartments')}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex items-center justify-center" style={{ padding: '4rem 1rem', minHeight: '60vh' }}>
        <div className="w-full max-w-lg rounded-3xl border border-line bg-navy-light text-center shadow-2xl shadow-black/40" style={{ padding: '3rem 1.75rem' }}>
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-300" style={{ marginBlockEnd: '1.25rem' }}>
            ✓
          </span>
          <h1 className="text-2xl font-extrabold text-white" style={{ marginBlockEnd: '0.7rem' }}>
            {done.paid ? t('successTitle') : t('doneTitle')}
          </h1>
          <p className="leading-8 text-muted" style={{ marginBlockEnd: '1.75rem' }}>
            {done.paid ? t('successText') : done.paymentError ? t('paymentErrorText') : t('doneText')}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {!done.paid && (
              <a
                href={`${WHATSAPP_URL}?text=${encodeURIComponent(`${t('doneWaMessage')} ${itemName} (${start} → ${end})`)}`}
                target="_blank"
                rel="noreferrer"
                style={{ padding: '0.7rem 1.8rem' }}
                className="rounded-xl bg-[#25d366] font-bold text-white transition hover:brightness-110"
              >
                {t('doneWhatsapp')}
              </a>
            )}
            <Link href="/" style={{ padding: '0.7rem 1.8rem' }} className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy">
              {t('backHome')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- الصفحة ---------- */
  return (
    <div className="w-full max-w-6xl" style={{ marginInline: 'auto', padding: '2.5rem 1rem 4rem' }}>
      <Link href={backHref} className="inline-block text-sm font-bold text-gold-light hover:underline" style={{ marginBlockEnd: '1.25rem' }}>
        ← {isCar ? t('backCars') : t('backApartments')}
      </Link>

      <div className="flex flex-wrap items-center gap-4" style={{ marginBlockEnd: '2rem' }}>
        {item.images?.[0] && <img src={item.images[0]} alt={itemName} className="h-20 w-28 rounded-2xl border border-line object-cover" />}
        <div>
          <span className="inline-block rounded-full border border-gold/40 bg-gold/10 text-xs font-bold text-gold-light" style={{ padding: '0.2rem 0.8rem', marginBlockEnd: '0.4rem' }}>
            {isCar ? t('badgeCar') : t('badgeApartment')}
          </span>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">{itemName}</h1>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* ================= الفورم ================= */}
        <div className="flex flex-col gap-5">
          <Card n={1} title={t('datesTitle')} hint={isCar ? t('datesHintCar') : t('datesHintApt')}>
            <RangeCalendar busy={busy} start={start} end={end} onChange={(s, e) => { setStart(s); setEnd(e); }} />

            <div className="grid grid-cols-2 gap-3" style={{ marginBlockStart: '1rem' }}>
              {[
                [isCar ? t('startCar') : t('startApt'), start],
                [isCar ? t('endCar') : t('endApt'), end],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-xl border border-line bg-navy" style={{ padding: '0.7rem 0.9rem' }}>
                  <p className="text-xs text-muted">{label}</p>
                  <p dir="ltr" className="text-start font-bold text-white">{value || '—'}</p>
                </div>
              ))}
            </div>

            {days > 0 && (
              <p className="font-bold text-gold-light" style={{ marginBlockStart: '0.9rem' }}>
                {isCar ? t('daysCount', { n: days }) : t('nightsCount', { n: days })}
              </p>
            )}
          </Card>

          <Card n={2} title={t('extrasTitle')} hint={t('extrasHint')}>
            {extras.length === 0 ? (
              <p className="text-muted">{t('noExtras')}</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {extras.map((e) => {
                  const on = picked.includes(e.id);
                  return (
                    <button
                      key={e.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleExtra(e.id)}
                      style={{ padding: '0.9rem 1rem' }}
                      className={`flex items-center gap-3 rounded-2xl border text-start transition ${on ? 'border-gold bg-gold/10' : 'border-line bg-navy hover:border-gold/60'}`}
                    >
                      <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${on ? 'border-gold bg-gold text-navy' : 'border-line text-transparent'}`}>✓</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-white">{isAr ? e.name_ar : e.name_en}</span>
                        <span className="text-sm text-gold-light">
                          {fmt(currency === 'EGP' ? e.price_egp : e.price_usd)}
                          {e.per_day && <span className="text-muted"> / {isCar ? t('perDay') : t('perNight')}</span>}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card n={3} title={t('detailsTitle')}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white/85">{t('name')}</span>
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.75rem 1rem' }} className={inputClass} />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-bold text-white/85">{t('phone')}</span>
                <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 10 0000 0000" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </label>
            </div>
            <label className="flex flex-col gap-2" style={{ marginBlockStart: '1rem' }}>
              <span className="text-sm font-bold text-white/85">{t('notes')}</span>
              <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('notesPlaceholder')} style={{ padding: '0.75rem 1rem' }} className={`${inputClass} resize-y`} />
            </label>
          </Card>

          <Card n={4} title={t('discountTitle')} hint={t('discountHint')}>
            {discount ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10" style={{ padding: '0.8rem 1rem' }}>
                <span className="font-bold text-emerald-300">
                  ✓ <span dir="ltr">{discount.code}</span> — {t('applied')}
                </span>
                <button type="button" onClick={() => { setDiscount(null); setCode(''); }} className="text-sm font-bold text-red-300 hover:underline">
                  {t('remove')}
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && applyCode()}
                    placeholder={t('codePlaceholder')}
                    style={{ padding: '0.75rem 1rem' }}
                    className={`${inputClass} text-start font-bold tracking-widest`}
                  />
                  <button type="button" onClick={applyCode} disabled={codeBusy || !code.trim()} style={{ padding: '0.75rem 1.5rem' }} className="shrink-0 rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy disabled:opacity-50">
                    {codeBusy ? '...' : t('apply')}
                  </button>
                </div>
                {codeMsg && <p className="text-sm text-red-300" style={{ marginBlockStart: '0.6rem' }}>{codeMsg}</p>}
              </>
            )}
          </Card>
        </div>

        {/* ================= الملخص ================= */}
        <aside className="rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy shadow-2xl shadow-black/40 lg:sticky lg:top-40" style={{ padding: '1.5rem' }}>
          <h2 className="text-xl font-extrabold text-gold" style={{ marginBlockEnd: '1.1rem' }}>{t('summaryTitle')}</h2>

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted">
                {isCar ? t('unitCar') : t('unitApt')} × {days || 0}
              </span>
              <span className="font-bold text-white">{fmt(totals.base)}</span>
            </div>

            {chosen.map((e) => (
              <div key={e.id} className="flex justify-between gap-3">
                <span className="text-muted">{isAr ? e.name_ar : e.name_en}</span>
                <span className="font-bold text-white">
                  {fmt((currency === 'EGP' ? e.price_egp : e.price_usd) * (e.per_day ? days : 1))}
                </span>
              </div>
            ))}

            {totals.discountAmount > 0 && (
              <div className="flex justify-between gap-3 text-emerald-300">
                <span>{t('discountLine')}</span>
                <span className="font-bold">− {fmt(totals.discountAmount)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-line" style={{ marginBlock: '1.1rem', paddingBlockStart: '1.1rem' }}>
            <span className="font-bold text-white">{t('total')}</span>
            <span className="text-2xl font-extrabold text-gold-light">{fmt(totals.total)}</span>
          </div>

          {!loggedIn && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-center" style={{ padding: '0.9rem', marginBlockEnd: '1rem' }}>
              <p className="text-sm text-amber-300" style={{ marginBlockEnd: '0.6rem' }}>{t('loginText')}</p>
              <div className="flex justify-center gap-2">
                <Link href={loginHref} style={{ padding: '0.4rem 1.1rem' }} className="rounded-lg bg-gold text-sm font-bold text-navy">{t('loginBtn')}</Link>
                <Link href={signupHref} style={{ padding: '0.4rem 1.1rem' }} className="rounded-lg border border-gold text-sm font-bold text-gold">{t('signupBtn')}</Link>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300" style={{ padding: '0.7rem 0.9rem', marginBlockEnd: '1rem' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || submitting}
            style={{ padding: '0.9rem 1.5rem' }}
            className="w-full rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {submitting ? t('processing') : t('payNow')}
          </button>

          {days === 0 && <p className="text-center text-xs text-muted" style={{ marginBlockStart: '0.7rem' }}>{t('selectDatesHint')}</p>}
        </aside>
      </div>
    </div>
  );
}