'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  customer_code: string;
  created_at: string;
};

type Booking = {
  id: string;
  user_id: string;
  booking_type: 'car' | 'apartment';
  status: 'pending' | 'paid' | 'cancelled';
  total: number;
  total_egp: number;
  currency: 'EGP' | 'USD';
  start_date: string;
  end_date: string;
  created_at: string;
  cars: { name_ar: string } | null;
  apartments: { name_ar: string } | null;
};

type Stats = { count: number; paidCount: number; spent: number; last: string | null };
type Sort = 'newest' | 'bookings' | 'spent';

const LOC = 'ar-EG';
const money = (n: number) =>
  new Intl.NumberFormat(LOC, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
const num = (n: number) => new Intl.NumberFormat(LOC).format(n);
const dateAr = (iso: string) =>
  new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUS_LABEL = { paid: 'مدفوع', pending: 'معلّق', cancelled: 'ملغي' } as const;
const STATUS_STYLE = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-300',
} as const;

// 010xxxxxxxx -> 2010xxxxxxxx
function waNumber(phone: string | null) {
  if (!phone) return null;
  let d = phone.replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('00')) d = d.slice(2);
  else if (d.startsWith('0')) d = '20' + d.slice(1);
  return d;
}

const initialOf = (name: string | null) => (name?.trim()?.charAt(0) || '؟').toUpperCase();

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailsFailed, setEmailsFailed] = useState(false);
  const [toast, setToast] = useState('');

  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');

  const [selected, setSelected] = useState<Customer | null>(null);

  const [resetFor, setResetFor] = useState<Customer | null>(null);
  const [resetBusy, setResetBusy] = useState(false);
  const [resetError, setResetError] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const supabase = createClient();

    const [profilesRes, bookingsRes, emailsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, customer_code, created_at')
        .eq('role', 'customer')
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select(
          'id, user_id, booking_type, status, total, total_egp, currency, start_date, end_date, created_at, cars(name_ar), apartments(name_ar)'
        )
        .order('created_at', { ascending: false }),
      fetch('/api/admin/customers')
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .catch(() => null),
    ]);

    if (profilesRes.error) {
      setError('مقدرناش نحمّل العملاء: ' + profilesRes.error.message);
      setCustomers([]);
    } else {
      setCustomers((profilesRes.data ?? []) as Customer[]);
    }

    setBookings(
      ((bookingsRes.data ?? []) as any[]).map((b) => ({
        ...b,
        total: Number(b.total),
        total_egp: Number(b.total_egp),
        cars: Array.isArray(b.cars) ? (b.cars[0] ?? null) : (b.cars ?? null),
        apartments: Array.isArray(b.apartments) ? (b.apartments[0] ?? null) : (b.apartments ?? null),
      })) as Booking[]
    );

    if (emailsRes?.emails) {
      setEmails(emailsRes.emails);
      setEmailsFailed(false);
    } else {
      setEmailsFailed(true);
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

  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast(msg);
    } catch {
      showToast('معرفناش ننسخ، انسخه يدوي.');
    }
  }

  // إحصائيات كل عميل
  const statsMap = useMemo(() => {
    const m = new Map<string, Stats>();
    bookings.forEach((b) => {
      const s = m.get(b.user_id) ?? { count: 0, paidCount: 0, spent: 0, last: null };
      s.count += 1;
      if (b.status === 'paid') {
        s.paidCount += 1;
        s.spent += b.total_egp;
      }
      if (!s.last || b.created_at > s.last) s.last = b.created_at;
      m.set(b.user_id, s);
    });
    return m;
  }, [bookings]);

  const stat = (id: string): Stats => statsMap.get(id) ?? { count: 0, paidCount: 0, spent: 0, last: null };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = customers.filter((c) => {
      if (!q) return true;
      return `${c.full_name ?? ''} ${c.phone ?? ''} ${c.customer_code} ${emails[c.id] ?? ''}`
        .toLowerCase()
        .includes(q);
    });

    if (sort === 'bookings') return [...filtered].sort((a, b) => stat(b.id).count - stat(a.id).count);
    if (sort === 'spent') return [...filtered].sort((a, b) => stat(b.id).spent - stat(a.id).spent);
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, query, sort, emails, statsMap]);

  const topStats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    return {
      total: customers.length,
      newMonth: customers.filter((c) => new Date(c.created_at) >= monthStart).length,
      withBookings: customers.filter((c) => (statsMap.get(c.id)?.count ?? 0) > 0).length,
      revenue: customers.reduce((s, c) => s + (statsMap.get(c.id)?.spent ?? 0), 0),
    };
  }, [customers, statsMap]);

  async function doReset() {
    if (!resetFor) return;
    setResetBusy(true);
    setResetError('');

    try {
      const res = await fetch(`/api/admin/customers/${resetFor.id}/password`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setResetError(
          res.status === 403
            ? 'الحساب ده ملوش صلاحية.'
            : data.error === 'admin_not_allowed'
              ? 'مينفعش تغيّر باسورد أدمن من هنا.'
              : data.error?.includes('service')
                ? 'مفتاح SUPABASE_SERVICE_ROLE_KEY مش متظبط في ملف .env.local.'
                : 'فشل تغيير الباسورد: ' + (data.error ?? 'خطأ غير معروف')
        );
      } else {
        setNewPassword(data.password);
      }
    } catch {
      setResetError('حصل خطأ في الاتصال، حاول تاني.');
    }

    setResetBusy(false);
  }

  function closeReset() {
    if (resetBusy) return;
    setResetFor(null);
    setNewPassword('');
    setResetError('');
  }

  const waMessage = (c: Customer, password: string) =>
    [
      `مرحباً ${c.full_name ?? ''}`.trim() + '،',
      'تم تغيير كلمة المرور لحسابك في سولو ليمو.',
      '',
      `الإيميل: ${emails[c.id] ?? '—'}`,
      `كلمة المرور المؤقتة: ${password}`,
      '',
      'بعد ما تدخل، ننصحك تغيّرها لكلمة مرور تفتكرها.',
    ].join('\n');

  const renderAvatar = ({ c, size = 'h-12 w-12 text-lg' }: { c: Customer; size?: string }) => (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light font-extrabold text-navy ${size}`}
    >
      {initialOf(c.full_name)}
    </span>
  );

  const renderCodeChip = ({ code }: { code: string }) => (
    <button
      type="button"
      onClick={() => copy(code, `تم نسخ ${code}`)}
      title="اضغط للنسخ"
      dir="ltr"
      className="rounded-md border border-dashed border-gold/50 text-xs font-bold tracking-wider text-gold-light transition hover:bg-gold/10"
      style={{ padding: '0.15rem 0.55rem' }}
    >
      {code}
    </button>
  );

  const renderActions = ({ c }: { c: Customer }) => {
    const wa = waNumber(c.phone);
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelected(c)}
          style={{ padding: '0.4rem 0.95rem' }}
          className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
        >
          التفاصيل
        </button>
        {wa && (
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noreferrer"
            style={{ padding: '0.4rem 0.95rem' }}
            className="rounded-lg border border-[#25d366]/50 text-sm font-bold text-[#25d366] transition hover:bg-[#25d366] hover:text-white"
          >
            واتساب
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            setNewPassword('');
            setResetError('');
            setResetFor(c);
          }}
          style={{ padding: '0.4rem 0.95rem' }}
          className="rounded-lg border border-line text-sm font-bold text-muted transition hover:border-gold hover:text-gold-light"
        >
          تغيير الباسورد
        </button>
      </div>
    );
  };

  const selectedBookings = selected ? bookings.filter((b) => b.user_id === selected.id) : [];

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- العنوان ---------- */}
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">العملاء</h1>
        <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
          بيانات العملاء وحجوزاتهم، وتغيير كلمة المرور لو نسيوها.
        </p>
      </div>

      {/* ---------- الإحصائيات ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['إجمالي العملاء', num(topStats.total), 'text-white'],
          ['عملاء جدد هذا الشهر', num(topStats.newMonth), 'text-emerald-300'],
          ['عملاء حجزوا فعلاً', num(topStats.withBookings), 'text-gold-light'],
          ['إجمالي مدفوعاتهم', money(topStats.revenue), 'text-gold-light'],
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

      {/* ---------- البحث والترتيب ---------- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو التليفون أو الإيميل أو كود العميل..."
          style={{ padding: '0.75rem 1rem' }}
          className="w-full rounded-xl border border-line bg-navy-light text-white placeholder:text-muted/60 focus:border-gold focus:outline-none md:max-w-md"
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['newest', 'الأحدث'],
              ['bookings', 'الأكتر حجوزات'],
              ['spent', 'الأعلى إنفاقاً'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setSort(k)}
              style={{ padding: '0.45rem 1.05rem' }}
              className={`rounded-full border text-sm font-bold transition ${
                sort === k
                  ? 'border-gold bg-gold text-navy'
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

      {emailsFailed && !loading && (
        <p
          className="rounded-xl border border-amber-500/40 bg-amber-500/10 text-sm leading-7 text-amber-300"
          style={{ padding: '0.8rem 1rem' }}
        >
          الإيميلات مش ظاهرة لأن مفتاح <span dir="ltr">SUPABASE_SERVICE_ROLE_KEY</span> مش متظبط في{' '}
          <span dir="ltr">.env.local</span>. باقي البيانات شغّالة عادي.
        </p>
      )}

      {/* ---------- القائمة ---------- */}
      {loading ? (
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
            {customers.length === 0 ? 'لسه مفيش عملاء' : 'مفيش نتائج للبحث'}
          </p>
          <p className="text-muted">
            {customers.length === 0
              ? 'العملاء بيظهروا هنا أول ما يعملوا حسابات على الموقع.'
              : 'جرّب كلمة تانية.'}
          </p>
        </div>
      ) : (
        <>
          {/* جدول للشاشات الكبيرة */}
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-navy-light lg:block">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-line bg-navy/40 text-sm text-muted">
                  {['العميل', 'التواصل', 'الحجوزات', 'إجمالي المدفوع', 'انضم في', ''].map((h, i) => (
                    <th key={i} className="text-start font-bold" style={{ padding: '0.9rem 1rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const s = stat(c.id);
                  return (
                    <tr key={c.id} className="border-b border-line/60 transition hover:bg-navy/50">
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div className="flex items-center gap-3">
                          {renderAvatar({ c: c })}
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{c.full_name || 'بدون اسم'}</p>
                            {renderCodeChip({ code: c.customer_code })}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <p dir="ltr" className="text-start text-sm text-white">
                          {c.phone || '—'}
                        </p>
                        <p dir="ltr" className="max-w-52 truncate text-start text-xs text-muted">
                          {emails[c.id] || '—'}
                        </p>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <p className="font-bold text-white">{num(s.count)}</p>
                        <p className="text-xs text-muted">{num(s.paidCount)} مدفوع</p>
                      </td>
                      <td className="font-bold text-gold-light" style={{ padding: '0.9rem 1rem' }}>
                        {s.spent > 0 ? money(s.spent) : '—'}
                      </td>
                      <td className="text-sm text-muted" style={{ padding: '0.9rem 1rem' }}>
                        {dateAr(c.created_at)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {renderActions({ c: c })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* كروت للموبايل والتابلت */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((c) => {
              const s = stat(c.id);
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-navy-light"
                  style={{ padding: '1rem' }}
                >
                  <div className="flex items-center gap-3">
                    {renderAvatar({ c: c })}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{c.full_name || 'بدون اسم'}</p>
                      {renderCodeChip({ code: c.customer_code })}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 text-sm">
                    <p dir="ltr" className="text-start text-white">
                      {c.phone || '—'}
                    </p>
                    <p dir="ltr" className="truncate text-start text-xs text-muted">
                      {emails[c.id] || '—'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">الحجوزات</p>
                      <p className="font-bold text-white">
                        {num(s.count)} <span className="text-xs font-normal text-muted">({num(s.paidCount)} مدفوع)</span>
                      </p>
                    </div>
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">إجمالي المدفوع</p>
                      <p className="font-bold text-gold-light">{s.spent > 0 ? money(s.spent) : '—'}</p>
                    </div>
                  </div>

                  {renderActions({ c: c })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- تفاصيل العميل ---------- */}
      {selected && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
          <div onClick={() => setSelected(null)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-navy-light shadow-2xl shadow-black/60 sm:rounded-3xl">
            <div
              className="flex items-center justify-between gap-3 border-b border-line"
              style={{ padding: '1rem 1.25rem' }}
            >
              <div className="flex items-center gap-3">
                {renderAvatar({ c: selected, size: "h-11 w-11 text-lg" })}
                <div>
                  <h2 className="text-lg font-extrabold text-white">{selected.full_name || 'بدون اسم'}</h2>
                  {renderCodeChip({ code: selected.customer_code })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="إغلاق"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:border-gold hover:text-gold-light"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-5 overflow-y-auto" style={{ padding: '1.25rem' }}>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['رقم التليفون', selected.phone || '—', true],
                  ['الإيميل', emails[selected.id] || '—', true],
                  ['تاريخ الانضمام', dateAr(selected.created_at), false],
                  [
                    'آخر حجز',
                    stat(selected.id).last ? dateAr(stat(selected.id).last as string) : 'مفيش حجوزات',
                    false,
                  ],
                ].map(([label, value, ltr]) => (
                  <div
                    key={label as string}
                    className="rounded-xl border border-line bg-navy/50"
                    style={{ padding: '0.7rem 0.9rem' }}
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p dir={ltr ? 'ltr' : undefined} className="truncate text-start font-bold text-white">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  ['كل الحجوزات', num(stat(selected.id).count)],
                  ['المدفوعة', num(stat(selected.id).paidCount)],
                  ['إجمالي المدفوع', stat(selected.id).spent > 0 ? money(stat(selected.id).spent) : '—'],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-gold/10 text-center"
                    style={{ padding: '0.8rem 0.5rem' }}
                  >
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-extrabold text-gold-light" style={{ marginBlockStart: '0.2rem' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <h3 className="font-bold text-gold" style={{ marginBlockEnd: '0.75rem' }}>
                  حجوزاته
                </h3>

                {selectedBookings.length === 0 ? (
                  <p
                    className="rounded-xl border border-dashed border-line text-center text-muted"
                    style={{ padding: '1.5rem' }}
                  >
                    العميل ده لسه ما حجزش.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {selectedBookings.map((b) => (
                      <div
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-navy/50"
                        style={{ padding: '0.8rem 1rem' }}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">
                            {b.cars?.name_ar ?? b.apartments?.name_ar ?? '—'}
                          </p>
                          <p className="text-xs text-muted">
                            {dateAr(b.start_date)} – {dateAr(b.end_date)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-white">
                            {new Intl.NumberFormat(b.currency === 'EGP' ? LOC : 'en-US', {
                              style: 'currency',
                              currency: b.currency,
                              maximumFractionDigits: 0,
                            }).format(b.total)}
                          </span>
                          <span
                            className={`rounded-full border text-xs font-bold ${STATUS_STYLE[b.status]}`}
                            style={{ padding: '0.2rem 0.7rem' }}
                          >
                            {STATUS_LABEL[b.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="flex flex-wrap gap-3 border-t border-line"
              style={{ padding: '1rem 1.25rem' }}
            >
              {waNumber(selected.phone) && (
                <a
                  href={`https://wa.me/${waNumber(selected.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ padding: '0.65rem 1.4rem' }}
                  className="rounded-xl bg-[#25d366] font-bold text-white transition hover:brightness-110"
                >
                  راسله على واتساب
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const c = selected;
                  setSelected(null);
                  setNewPassword('');
                  setResetError('');
                  setResetFor(c);
                }}
                style={{ padding: '0.65rem 1.4rem' }}
                className="rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy"
              >
                تغيير كلمة المرور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- تغيير الباسورد ---------- */}
      {resetFor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ padding: '1rem' }}>
          <div onClick={closeReset} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

          <div
            className="relative w-full max-w-md rounded-3xl border border-line bg-navy-light text-center shadow-2xl shadow-black/60"
            style={{ padding: '2rem 1.5rem' }}
          >
            {!newPassword ? (
              <>
                <h3 className="text-xl font-extrabold text-white" style={{ marginBlock: '1rem 0.5rem' }}>
                  تغيير كلمة مرور العميل
                </h3>
                <p className="leading-8 text-muted">
                  هنعمل كلمة مرور مؤقتة جديدة لـ «{resetFor.full_name || 'العميل'}»، وكلمة المرور القديمة هتبطل
                  تشتغل فوراً.
                </p>

                {resetError && (
                  <p
                    className="rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-300"
                    style={{ padding: '0.7rem 1rem', marginBlockStart: '1rem' }}
                  >
                    {resetError}
                  </p>
                )}

                <div className="flex gap-3" style={{ marginBlockStart: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={closeReset}
                    disabled={resetBusy}
                    style={{ padding: '0.7rem 1rem' }}
                    className="flex-1 rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={doReset}
                    disabled={resetBusy}
                    style={{ padding: '0.7rem 1rem' }}
                    className="flex-1 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy disabled:opacity-60"
                  >
                    {resetBusy ? 'جاري التغيير...' : 'غيّر الباسورد'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-extrabold text-white" style={{ marginBlock: '1rem 0.5rem' }}>
                  تم تغيير كلمة المرور
                </h3>
                <p className="text-muted">دي كلمة المرور الجديدة، وهتظهر مرة واحدة بس. ابعتها للعميل.</p>

                <button
                  type="button"
                  onClick={() => copy(newPassword, 'تم نسخ كلمة المرور')}
                  title="اضغط للنسخ"
                  dir="ltr"
                  className="w-full rounded-xl border-2 border-dashed border-gold text-2xl font-extrabold tracking-[0.25em] text-gold-light transition hover:bg-gold/10"
                  style={{ padding: '0.9rem 1rem', marginBlock: '1.25rem 0.5rem' }}
                >
                  {newPassword}
                </button>
                <p className="text-xs text-muted">اضغط على الكلمة لنسخها</p>

                <div className="flex flex-col gap-3" style={{ marginBlockStart: '1.5rem' }}>
                  {waNumber(resetFor.phone) && (
                    <a
                      href={`https://wa.me/${waNumber(resetFor.phone)}?text=${encodeURIComponent(
                        waMessage(resetFor, newPassword)
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ padding: '0.75rem 1rem' }}
                      className="rounded-xl bg-[#25d366] font-bold text-white transition hover:brightness-110"
                    >
                      ابعتها للعميل على واتساب
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={closeReset}
                    style={{ padding: '0.7rem 1rem' }}
                    className="rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light"
                  >
                    تمام، قفل
                  </button>
                </div>
              </>
            )}
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
