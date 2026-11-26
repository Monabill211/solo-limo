'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

type Status = 'pending' | 'paid' | 'cancelled';
type Kind = 'car' | 'apartment';

type Booking = {
  id: string;
  booking_type: Kind;
  start_date: string;
  end_date: string;
  days: number;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  currency: 'EGP' | 'USD';
  exchange_rate: number;
  unit_price: number;
  extras_total: number;
  discount_amount: number;
  total: number;
  total_egp: number;
  status: Status;
  created_at: string;
  item_name: string;
  discount_code: string | null;
  extras: { name: string; quantity: number; unit_price: number }[];
  finance: { unit_cost_egp: number; extras_cost_egp: number; total_cost_egp: number } | null;
  payments: { id: string; status: string; amount: number; currency: string; provider: string; created_at: string }[];
};

const LOC = 'ar-EG';
const num = (n: number) => new Intl.NumberFormat(LOC).format(n);
const money = (n: number, c: 'EGP' | 'USD' = 'EGP') =>
  new Intl.NumberFormat(c === 'EGP' ? LOC : 'en-US', {
    style: 'currency',
    currency: c,
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
const dateAr = (iso: string) =>
  new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
const dateTimeAr = (iso: string) =>
  new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(
    new Date(iso)
  );

const STATUS_LABEL: Record<Status, string> = { paid: 'مدفوع', pending: 'معلّق', cancelled: 'ملغي' };
const STATUS_STYLE: Record<Status, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-300',
};
const PAY_LABEL: Record<string, string> = {
  success: 'نجحت',
  pending: 'معلّقة',
  failed: 'فشلت',
  refunded: 'مستردة',
};

const one = <T,>(x: T | T[] | null | undefined): T | null =>
  Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

const ref = (id: string) => id.slice(0, 8).toUpperCase();

function waNumber(phone: string | null) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '20' + d.slice(1);
  return d;
}

type StatusFilter = 'all' | Status;
type TypeFilter = 'all' | Kind;

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [type, setType] = useState<TypeFilter>('all');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | 'cancel' | 'delete'>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await createClient()
      .from('bookings')
      .select(
        '*, cars(name_ar), apartments(name_ar), discount_codes(code), booking_extras(quantity, unit_price, extras(name_ar)), booking_finance(*), payments(id, status, amount, currency, provider, created_at)'
      )
      .order('created_at', { ascending: false });

    if (err) {
      setError('مقدرناش نحمّل الحجوزات: ' + err.message);
      setItems([]);
    } else {
      setItems(
        ((data ?? []) as any[]).map((b) => {
          const fin = one<any>(b.booking_finance);
          return {
            id: b.id,
            booking_type: b.booking_type,
            start_date: b.start_date,
            end_date: b.end_date,
            days: Number(b.days),
            customer_name: b.customer_name,
            customer_phone: b.customer_phone,
            notes: b.notes,
            currency: b.currency,
            exchange_rate: Number(b.exchange_rate),
            unit_price: Number(b.unit_price),
            extras_total: Number(b.extras_total),
            discount_amount: Number(b.discount_amount),
            total: Number(b.total),
            total_egp: Number(b.total_egp),
            status: b.status,
            created_at: b.created_at,
            item_name: one<any>(b.cars)?.name_ar ?? one<any>(b.apartments)?.name_ar ?? '—',
            discount_code: one<any>(b.discount_codes)?.code ?? null,
            extras: ((b.booking_extras ?? []) as any[]).map((x) => ({
              name: one<any>(x.extras)?.name_ar ?? '—',
              quantity: x.quantity,
              unit_price: Number(x.unit_price),
            })),
            finance: fin
              ? {
                  unit_cost_egp: Number(fin.unit_cost_egp),
                  extras_cost_egp: Number(fin.extras_cost_egp),
                  total_cost_egp: Number(fin.total_cost_egp),
                }
              : null,
            payments: ((b.payments ?? []) as any[]).map((p) => ({ ...p, amount: Number(p.amount) })),
          } as Booking;
        })
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function showToast(text: string) {
    setToast(text);
    setTimeout(() => setToast(''), 3000);
  }

  async function updateStatus(b: Booking, next: Status) {
    if (b.status === next) return;
    setBusyId(b.id);
    setActionError('');

    const { error: err } = await createClient().from('bookings').update({ status: next }).eq('id', b.id).select('id').single();

    if (err) {
      const msg =
        err.code === '23P01'
          ? 'مينفعش ترجّع الحجز ده، التواريخ دي اتحجزت لحجز تاني.'
          : err.code === '42501'
            ? 'الحساب ده ملوش صلاحية التعديل.'
            : err.message;
      setActionError(msg);
      showToast(err.message);
    } else {
      setItems((p) => p.map((x) => (x.id === b.id ? { ...x, status: next } : x)));
      setConfirm(null);
      showToast(
        next === 'paid' ? 'تم تأكيد الدفع ✓' : next === 'cancelled' ? 'تم إلغاء الحجز' : 'رجع الحجز معلّق'
      );
    }
    setBusyId(null);
  }

  async function deleteBooking(b: Booking) {
    setBusyId(b.id);
    setActionError('');

    const { error: err } = await createClient().from('bookings').delete().eq('id', b.id).select('id').single();

    if (err) {
      setActionError(err.message);
    } else {
      setItems((p) => p.filter((x) => x.id !== b.id));
      setSelectedId(null);
      setConfirm(null);
      showToast('تم حذف الحجز');
    }
    setBusyId(null);
  }

  const counts = useMemo(() => {
    const c = { all: items.length, pending: 0, paid: 0, cancelled: 0 };
    items.forEach((b) => (c[b.status] += 1));
    return c;
  }, [items]);

  const stats = useMemo(() => {
    const paid = items.filter((b) => b.status === 'paid');
    return {
      revenue: paid.reduce((s, b) => s + b.total_egp, 0),
      profit: paid.reduce((s, b) => s + (b.finance ? b.total_egp - b.finance.total_cost_egp : 0), 0),
    };
  }, [items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((b) => {
      if (status !== 'all' && b.status !== status) return false;
      if (type !== 'all' && b.booking_type !== type) return false;
      if (!q) return true;
      return `${ref(b.id)} ${b.customer_name ?? ''} ${b.customer_phone ?? ''} ${b.item_name}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, status, type]);

  const selected = items.find((b) => b.id === selectedId) ?? null;

  const open = (b: Booking) => {
    setActionError('');
    setConfirm(null);
    setSelectedId(b.id);
  };

  const renderBadge = ({ s }: { s: Status }) => (
    <span
      className={`rounded-full border text-xs font-bold ${STATUS_STYLE[s]}`}
      style={{ padding: '0.25rem 0.8rem' }}
    >
      {STATUS_LABEL[s]}
    </span>
  );

  const renderDates = ({ b }: { b: Booking }) => (
    <>
      <p className="text-sm text-white">
        {dateAr(b.start_date)} ← {dateAr(b.end_date)}
      </p>
      <p className="text-xs text-muted">
        {b.booking_type === 'car' ? `${num(b.days)} أيام` : `${num(b.days)} ليالي`}
      </p>
    </>
  );

  const renderRowActions = ({ b }: { b: Booking }) => (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => open(b)}
        style={{ padding: '0.4rem 0.95rem' }}
        className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
      >
        التفاصيل
      </button>
      {b.status === 'pending' && (
        <button
          type="button"
          disabled={busyId === b.id}
          onClick={() => updateStatus(b, 'paid')}
          style={{ padding: '0.4rem 0.95rem' }}
          className="rounded-lg border border-emerald-500/50 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500 hover:text-white disabled:opacity-50"
        >
          تأكيد الدفع
        </button>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- العنوان ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">الحجوزات</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
            تابع كل الحجوزات، أكّد الدفع، وشوف الأرباح.
          </p>
        </div>

        <button
          type="button"
          onClick={load}
          disabled={loading}
          style={{ padding: '0.65rem 1.3rem' }}
          className="rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy disabled:opacity-50"
        >
          {loading ? 'جاري التحديث...' : '↻ تحديث'}
        </button>
      </div>

      {/* ---------- الإحصائيات ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['كل الحجوزات', num(counts.all), 'text-white'],
          ['معلّقة (محتاجة دفع)', num(counts.pending), 'text-amber-300'],
          ['إيرادات المدفوع', money(stats.revenue), 'text-gold-light'],
          ['صافي الربح', money(stats.profit), stats.profit >= 0 ? 'text-emerald-300' : 'text-red-300'],
        ].map(([label, value, color]) => (
          <div
            key={label}
            className="rounded-2xl border border-line bg-navy-light"
            style={{ padding: '1rem 1.1rem' }}
          >
            <p className="text-sm text-muted">{label}</p>
            <p className={`text-xl font-extrabold md:text-2xl ${color}`} style={{ marginBlockStart: '0.3rem' }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ---------- البحث والفلاتر ---------- */}
      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث برقم الحجز أو اسم العميل أو التليفون أو اسم السيارة/الشقة..."
          style={{ padding: '0.75rem 1rem' }}
          className="w-full rounded-xl border border-line bg-navy-light text-white placeholder:text-muted/60 focus:border-gold focus:outline-none lg:max-w-2xl"
        />

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ['all', 'الكل'],
              ['pending', 'معلّق'],
              ['paid', 'مدفوع'],
              ['cancelled', 'ملغي'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatus(k)}
              style={{ padding: '0.45rem 1.05rem' }}
              className={`rounded-full border text-sm font-bold transition ${
                status === k
                  ? 'border-gold bg-gold text-navy'
                  : 'border-line text-muted hover:border-gold hover:text-gold-light'
              }`}
            >
              {label} ({counts[k]})
            </button>
          ))}

          <span className="mx-1 hidden h-6 w-px bg-line sm:block" />

          {(
            [
              ['all', 'كل الأنواع'],
              ['car', 'سيارات'],
              ['apartment', 'شقق'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setType(k)}
              style={{ padding: '0.45rem 1.05rem' }}
              className={`rounded-full border text-sm font-bold transition ${
                type === k
                  ? 'border-gold bg-gold/20 text-gold-light'
                  : 'border-line text-muted hover:border-gold hover:text-gold-light'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300"
          style={{ padding: '0.8rem 1rem' }}
        >
          {error}
        </p>
      )}

      {/* ---------- القائمة ---------- */}
      {loading && items.length === 0 ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-line bg-navy-light" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
          style={{ padding: '3.5rem 1.5rem' }}
        >
          <p className="text-xl font-bold text-white">
            {items.length === 0 ? 'لسه مفيش حجوزات' : 'مفيش نتائج للبحث'}
          </p>
          <p className="text-muted">
            {items.length === 0 ? 'الحجوزات بتظهر هنا أول ما العملاء يحجزوا.' : 'جرّب كلمة تانية أو غيّر الفلتر.'}
          </p>
        </div>
      ) : (
        <>
          {/* جدول للشاشات الكبيرة */}
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-navy-light lg:block">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-line bg-navy/40 text-sm text-muted">
                  {['رقم الحجز', 'العميل', 'الخدمة', 'التواريخ', 'الإجمالي', 'الحالة', ''].map((h, i) => (
                    <th key={i} className="text-start font-bold" style={{ padding: '0.9rem 1rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((b) => (
                  <tr key={b.id} className="border-b border-line/60 transition hover:bg-navy/50">
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <p dir="ltr" className="text-start font-bold text-gold-light">
                        {ref(b.id)}
                      </p>
                      <p className="text-xs text-muted">{dateTimeAr(b.created_at)}</p>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <p className="font-bold text-white">{b.customer_name || '—'}</p>
                      <p dir="ltr" className="text-start text-xs text-muted">
                        {b.customer_phone || '—'}
                      </p>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <p className="max-w-48 truncate text-white">
                        {b.item_name}
                      </p>
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {renderDates({ b: b })}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      <p className="font-bold text-white">{money(b.total, b.currency)}</p>
                      {b.currency === 'USD' && <p className="text-xs text-muted">≈ {money(b.total_egp)}</p>}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {renderBadge({ s: b.status })}
                    </td>
                    <td style={{ padding: '0.9rem 1rem' }}>
                      {renderRowActions({ b: b })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* كروت للموبايل والتابلت */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((b) => (
              <div
                key={b.id}
                className="flex flex-col gap-3 rounded-2xl border border-line bg-navy-light"
                style={{ padding: '1rem' }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span dir="ltr" className="font-bold text-gold-light">
                    {ref(b.id)}
                  </span>
                  {renderBadge({ s: b.status })}
                </div>

                <div>
                  <p className="font-bold text-white">{b.customer_name || '—'}</p>
                  <p dir="ltr" className="text-start text-xs text-muted">
                    {b.customer_phone || '—'}
                  </p>
                </div>

                <p className="truncate text-white">
                  {b.item_name}
                </p>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    {renderDates({ b: b })}
                  </div>
                  <p className="text-lg font-extrabold text-gold-light">{money(b.total, b.currency)}</p>
                </div>

                {renderRowActions({ b: b })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ---------- تفاصيل الحجز ---------- */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div onClick={() => setSelectedId(null)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-navy-light shadow-2xl shadow-black/60 sm:rounded-3xl">
            <div
              className="flex items-center justify-between gap-3 border-b border-line"
              style={{ padding: '1rem 1.25rem' }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-extrabold text-white">
                  حجز{' '}
                  <span dir="ltr" className="text-gold-light">
                    {ref(selected.id)}
                  </span>
                </h2>
                {renderBadge({ s: selected.status })}
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                aria-label="إغلاق"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:border-gold hover:text-gold-light"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4 overflow-y-auto" style={{ padding: '1.25rem' }}>
              {/* الخدمة والتواريخ */}
              <section className="rounded-2xl border border-line bg-navy/50" style={{ padding: '1rem 1.1rem' }}>
                <p className="text-xs text-muted">{selected.booking_type === 'car' ? 'سيارة' : 'شقة'}</p>
                <p className="text-lg font-bold text-white">{selected.item_name}</p>
                <div className="grid gap-2 sm:grid-cols-3" style={{ marginBlockStart: '0.8rem' }}>
                  {[
                    [selected.booking_type === 'car' ? 'الاستلام' : 'الدخول', dateAr(selected.start_date)],
                    [selected.booking_type === 'car' ? 'التسليم' : 'الخروج', dateAr(selected.end_date)],
                    ['المدة', selected.booking_type === 'car' ? `${num(selected.days)} أيام` : `${num(selected.days)} ليالي`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-navy" style={{ padding: '0.55rem 0.8rem' }}>
                      <p className="text-xs text-muted">{label}</p>
                      <p className="font-bold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* العميل */}
              <section className="rounded-2xl border border-line bg-navy/50" style={{ padding: '1rem 1.1rem' }}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted">العميل</p>
                    <p className="font-bold text-white">{selected.customer_name || '—'}</p>
                    <p dir="ltr" className="text-start text-sm text-muted">
                      {selected.customer_phone || '—'}
                    </p>
                  </div>
                  {waNumber(selected.customer_phone) && (
                    <a
                      href={`https://wa.me/${waNumber(selected.customer_phone)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '0.5rem 1.2rem' }}
                      className="rounded-xl bg-[#25d366] text-sm font-bold text-white transition hover:brightness-110"
                    >
                      واتساب
                    </a>
                  )}
                </div>
                {selected.notes && (
                  <p
                    className="rounded-xl bg-navy text-sm leading-7 text-white/85"
                    style={{ padding: '0.7rem 0.9rem', marginBlockStart: '0.8rem' }}
                  >
                    <span className="text-muted">ملاحظات: </span>
                    {selected.notes}
                  </p>
                )}
              </section>

              {/* الحسبة */}
              <section className="rounded-2xl border border-line bg-navy/50" style={{ padding: '1rem 1.1rem' }}>
                <p className="font-bold text-gold" style={{ marginBlockEnd: '0.8rem' }}>
                  الحسبة
                </p>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted">
                      {money(selected.unit_price, selected.currency)} × {num(selected.days)}
                    </span>
                    <span className="font-bold text-white">
                      {money(selected.unit_price * selected.days, selected.currency)}
                    </span>
                  </div>

                  {selected.extras.map((e, i) => (
                    <div key={i} className="flex justify-between gap-3">
                      <span className="text-muted">{e.name}</span>
                      <span className="font-bold text-white">{money(e.unit_price * e.quantity, selected.currency)}</span>
                    </div>
                  ))}

                  {selected.discount_amount > 0 && (
                    <div className="flex justify-between gap-3 text-emerald-300">
                      <span>
                        خصم{selected.discount_code && (
                          <span dir="ltr" className="font-bold">
                            {' '}
                            ({selected.discount_code})
                          </span>
                        )}
                      </span>
                      <span className="font-bold">− {money(selected.discount_amount, selected.currency)}</span>
                    </div>
                  )}
                </div>

                <div
                  className="flex items-center justify-between border-t border-line"
                  style={{ marginBlockStart: '0.9rem', paddingBlockStart: '0.9rem' }}
                >
                  <span className="font-bold text-white">الإجمالي</span>
                  <span className="text-xl font-extrabold text-gold-light">
                    {money(selected.total, selected.currency)}
                  </span>
                </div>

                {selected.currency === 'USD' && (
                  <p className="text-xs text-muted" style={{ marginBlockStart: '0.4rem' }}>
                    ≈ {money(selected.total_egp)} (سعر الدولار {num(selected.exchange_rate)} جنيه)
                  </p>
                )}

                {selected.finance && (
                  <div
                    className="grid grid-cols-2 gap-2 text-sm"
                    style={{ marginBlockStart: '0.9rem' }}
                  >
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">التكلفة</p>
                      <p className="font-bold text-white">{money(selected.finance.total_cost_egp)}</p>
                    </div>
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">الربح</p>
                      <p
                        className={`font-bold ${
                          selected.total_egp - selected.finance.total_cost_egp >= 0
                            ? 'text-emerald-400'
                            : 'text-red-400'
                        }`}
                      >
                        {money(selected.total_egp - selected.finance.total_cost_egp)}
                      </p>
                    </div>
                  </div>
                )}
              </section>

              {/* المدفوعات */}
              <section className="rounded-2xl border border-line bg-navy/50" style={{ padding: '1rem 1.1rem' }}>
                <p className="font-bold text-gold" style={{ marginBlockEnd: '0.7rem' }}>
                  المدفوعات
                </p>
                {selected.payments.length === 0 ? (
                  <p className="text-sm text-muted">مفيش عمليات دفع أونلاين مسجّلة على الحجز ده.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {selected.payments.map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy text-sm"
                        style={{ padding: '0.6rem 0.8rem' }}
                      >
                        <span className="text-muted">
                          {p.provider} · {dateTimeAr(p.created_at)}
                        </span>
                        <span className="font-bold text-white">
                          {money(p.amount, p.currency === 'USD' ? 'USD' : 'EGP')}{' '}
                          <span
                            className={
                              p.status === 'success'
                                ? 'text-emerald-300'
                                : p.status === 'failed'
                                  ? 'text-red-300'
                                  : 'text-amber-300'
                            }
                          >
                            ({PAY_LABEL[p.status] ?? p.status})
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted" style={{ marginBlockStart: '0.7rem' }}>
                  تم الحجز في {dateTimeAr(selected.created_at)}
                </p>
              </section>

              {actionError && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300"
                  style={{ padding: '0.7rem 1rem' }}
                >
                  {actionError}
                </p>
              )}
            </div>

            {/* ----- الأزرار ----- */}
            <div className="border-t border-line" style={{ padding: '1rem 1.25rem' }}>
              {confirm ? (
                <div className="flex flex-col gap-3">
                  <p className="text-center font-bold text-white">
                    {confirm === 'cancel'
                      ? 'متأكد إنك عاوز تلغي الحجز؟ التواريخ هترجع متاحة.'
                      : 'هيتحذف الحجز نهائياً ومينفعش ترجعه. متأكد؟'}
                  </p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirm(null)}
                      disabled={busyId === selected.id}
                      style={{ padding: '0.65rem 1rem' }}
                      className="flex-1 rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light"
                    >
                      رجوع
                    </button>
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() =>
                        confirm === 'cancel' ? updateStatus(selected, 'cancelled') : deleteBooking(selected)
                      }
                      style={{ padding: '0.65rem 1rem' }}
                      className="flex-1 rounded-xl bg-red-500 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
                    >
                      {busyId === selected.id ? 'جاري التنفيذ...' : confirm === 'cancel' ? 'أيوه، ألغي' : 'أيوه، احذف'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {selected.status !== 'paid' && selected.status !== 'cancelled' && (
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => updateStatus(selected, 'paid')}
                      style={{ padding: '0.65rem 1.4rem' }}
                      className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40 disabled:opacity-60"
                    >
                      تأكيد الدفع
                    </button>
                  )}

                  {selected.status === 'paid' && (
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => updateStatus(selected, 'pending')}
                      style={{ padding: '0.65rem 1.4rem' }}
                      className="rounded-xl border border-amber-500/50 font-bold text-amber-300 transition hover:bg-amber-500 hover:text-navy disabled:opacity-60"
                    >
                      رجّعه معلّق
                    </button>
                  )}

                  {selected.status === 'cancelled' && (
                    <button
                      type="button"
                      disabled={busyId === selected.id}
                      onClick={() => updateStatus(selected, 'pending')}
                      style={{ padding: '0.65rem 1.4rem' }}
                      className="rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy disabled:opacity-60"
                    >
                      استرجاع الحجز
                    </button>
                  )}

                  {selected.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setConfirm('cancel')}
                      style={{ padding: '0.65rem 1.4rem' }}
                      className="rounded-xl border border-red-500/40 font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      إلغاء الحجز
                    </button>
                  )}

                  {selected.status === 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => setConfirm('delete')}
                      style={{ padding: '0.65rem 1.4rem' }}
                      className="rounded-xl border border-red-500/40 font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                    >
                      حذف نهائي
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------- رسالة سريعة ---------- */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-gold/50 bg-navy-light font-bold text-gold-light shadow-2xl shadow-black/50"
          style={{ padding: '0.75rem 1.5rem' }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}