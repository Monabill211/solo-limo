'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import ApartmentForm, { AMENITIES, type ApartmentRow } from '../../components/admin/ApartmentForm';

const money = (n: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

type Filter = 'all' | 'active' | 'hidden';

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-gold' : 'bg-line'}`}
    >
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
          on ? 'right-1' : 'right-6'
        }`}
      />
    </button>
  );
}

export default function AdminApartmentsPage() {
  const [items, setItems] = useState<ApartmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ApartmentRow | null>(null);
  const [deleting, setDeleting] = useState<ApartmentRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await createClient()
      .from('apartments')
      .select('*, costs(cost_egp)')
      .order('created_at', { ascending: false });

    if (err) {
      setError('مقدرناش نحمّل الشقق: ' + err.message);
      setItems([]);
    } else {
      setItems(
        (data ?? []).map((a: any) => {
          const cost = Array.isArray(a.costs) ? a.costs[0]?.cost_egp : a.costs?.cost_egp;
          return {
            ...a,
            price_egp: Number(a.price_egp),
            price_usd: Number(a.price_usd),
            images: a.images ?? [],
            amenities: a.amenities ?? [],
            cost_egp: cost === undefined || cost === null ? null : Number(cost),
          } as ApartmentRow;
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

  async function toggleActive(a: ApartmentRow) {
    const next = !a.active;
    setItems((p) => p.map((x) => (x.id === a.id ? { ...x, active: next } : x)));

    const { error: err } = await createClient()
      .from('apartments')
      .update({ active: next })
      .eq('id', a.id);
    if (err) {
      setItems((p) => p.map((x) => (x.id === a.id ? { ...x, active: !next } : x)));
      showToast('فشل تغيير الحالة');
    } else {
      showToast(next ? 'الشقة بقت ظاهرة في الموقع' : 'الشقة اتخبّت من الموقع');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');

    const { error: err } = await createClient().from('apartments').delete().eq('id', deleting.id);

    if (err) {
      setDeleteError(
        err.code === '23503'
          ? 'مينفعش تحذف شقة عليها حجوزات. اقفل زرار "ظاهرة" عشان تخفيها من الموقع بدل الحذف.'
          : err.message
      );
      setDeleteBusy(false);
      return;
    }

    setDeleteBusy(false);
    setDeleting(null);
    showToast('تم حذف الشقة');
    load();
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((a) => {
      if (filter === 'active' && !a.active) return false;
      if (filter === 'hidden' && a.active) return false;
      if (!q) return true;
      return `${a.name_ar} ${a.name_en} ${a.location_ar ?? ''} ${a.location_en ?? ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, filter]);

  const counts = {
    all: items.length,
    active: items.filter((a) => a.active).length,
    hidden: items.filter((a) => !a.active).length,
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (a: ApartmentRow) => {
    setEditing(a);
    setFormOpen(true);
  };

  const details = (a: ApartmentRow) =>
    [
      a.location_ar,
      a.bedrooms !== null && `${a.bedrooms} غرف`,
      a.max_guests !== null && `${a.max_guests} ضيوف`,
    ]
      .filter(Boolean)
      .join(' · ');

  const Thumb = ({ a }: { a: ApartmentRow }) =>
    a.images[0] ? (
      <img src={a.images[0]} alt={a.name_ar} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
    ) : (
      <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-xl border border-line bg-navy text-2xl">
        🏢
      </span>
    );

  const Amenities = ({ a }: { a: ApartmentRow }) =>
    a.amenities.length > 0 ? (
      <div className="flex flex-wrap gap-1.5">
        {a.amenities.slice(0, 4).map((k) => (
          <span
            key={k}
            className="rounded-full border border-line text-xs text-muted"
            style={{ padding: '0.1rem 0.6rem' }}
          >
            {AMENITIES[k] ?? k}
          </span>
        ))}
        {a.amenities.length > 4 && (
          <span className="text-xs text-gold">+{a.amenities.length - 4}</span>
        )}
      </div>
    ) : null;

  const Actions = ({ a }: { a: ApartmentRow }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openEdit(a)}
        style={{ padding: '0.4rem 1rem' }}
        className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
      >
        تعديل
      </button>
      <button
        type="button"
        onClick={() => {
          setDeleteError('');
          setDeleting(a);
        }}
        style={{ padding: '0.4rem 1rem' }}
        className="rounded-lg border border-red-500/40 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
      >
        حذف
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- العنوان ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">الشقق الفندقية</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
            أضف وعدّل الشقق وأسعارها وتكلفتها ومرافقها.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          style={{ padding: '0.75rem 1.5rem' }}
          className="flex items-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
        >
          <span className="text-xl leading-none">+</span>
          إضافة شقة
        </button>
      </div>

      {/* ---------- البحث والفلتر ---------- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الشقة أو الموقع..."
          style={{ padding: '0.75rem 1rem' }}
          className="w-full rounded-xl border border-line bg-navy-light text-white placeholder:text-muted/60 focus:border-gold focus:outline-none md:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'الكل'],
              ['active', 'ظاهرة'],
              ['hidden', 'مخفية'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{ padding: '0.45rem 1.1rem' }}
              className={`rounded-full border text-sm font-bold transition ${
                filter === k
                  ? 'border-gold bg-gold text-navy'
                  : 'border-line text-muted hover:border-gold hover:text-gold-light'
              }`}
            >
              {label} ({counts[k]})
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
      {loading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-line bg-navy-light" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
          style={{ padding: '3.5rem 1.5rem' }}
        >
          <span className="text-5xl">🏢</span>
          <p className="text-xl font-bold text-white">
            {items.length === 0 ? 'لسه مفيش شقق' : 'مفيش نتائج للبحث'}
          </p>
          <p className="text-muted">
            {items.length === 0 ? 'ابدأ بإضافة أول شقة.' : 'جرّب كلمة تانية أو غيّر الفلتر.'}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={openAdd}
              style={{ padding: '0.7rem 1.75rem', marginBlockStart: '0.5rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
            >
              إضافة شقة
            </button>
          )}
        </div>
      ) : (
        <>
          {/* جدول للشاشات الكبيرة */}
          <div className="hidden overflow-hidden rounded-3xl border border-line bg-navy-light lg:block">
            <table className="w-full text-start">
              <thead>
                <tr className="border-b border-line bg-navy/40 text-sm text-muted">
                  {['الشقة', 'السعر لليلة', 'التكلفة والربح', 'ظاهرة', ''].map((h, i) => (
                    <th key={i} className="text-start font-bold" style={{ padding: '0.9rem 1rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const profit = a.cost_egp !== null ? a.price_egp - a.cost_egp : null;
                  return (
                    <tr key={a.id} className="border-b border-line/60 transition hover:bg-navy/50">
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div className="flex items-center gap-4">
                          <Thumb a={a} />
                          <div className="flex min-w-0 flex-col gap-1">
                            <p className="truncate font-bold text-white">{a.name_ar}</p>
                            <p dir="ltr" className="truncate text-start text-sm text-muted">
                              {a.name_en}
                            </p>
                            <p className="truncate text-xs text-muted">{details(a)}</p>
                            <Amenities a={a} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <p className="font-bold text-white">{money(a.price_egp)}</p>
                        <p className="text-sm text-muted">{usd(a.price_usd)}</p>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {a.cost_egp !== null ? (
                          <>
                            <p className="text-sm text-muted">التكلفة: {money(a.cost_egp)}</p>
                            <p
                              className={`font-bold ${
                                (profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              ربح: {money(profit ?? 0)}
                            </p>
                          </>
                        ) : (
                          <span className="text-sm text-muted">مش متسجّلة</span>
                        )}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Switch on={a.active} onClick={() => toggleActive(a)} label="إظهار الشقة" />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Actions a={a} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* كروت للموبايل والتابلت */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((a) => {
              const profit = a.cost_egp !== null ? a.price_egp - a.cost_egp : null;
              return (
                <div
                  key={a.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-navy-light"
                  style={{ padding: '1rem' }}
                >
                  <div className="flex items-center gap-3">
                    <Thumb a={a} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{a.name_ar}</p>
                      <p dir="ltr" className="truncate text-start text-sm text-muted">
                        {a.name_en}
                      </p>
                      <p className="truncate text-xs text-muted">{details(a)}</p>
                    </div>
                    <Switch on={a.active} onClick={() => toggleActive(a)} label="إظهار الشقة" />
                  </div>

                  <Amenities a={a} />

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">السعر لليلة</p>
                      <p className="font-bold text-white">{money(a.price_egp)}</p>
                      <p className="text-xs text-muted">{usd(a.price_usd)}</p>
                    </div>
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">الربح لليلة</p>
                      {profit !== null ? (
                        <p className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {money(profit)}
                        </p>
                      ) : (
                        <p className="text-muted">مش متسجّل</p>
                      )}
                    </div>
                  </div>

                  <Actions a={a} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- النموذج ---------- */}
      {formOpen && (
        <ApartmentForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            showToast(editing ? 'تم حفظ التعديلات ✓' : 'تمت إضافة الشقة ✓');
            load();
          }}
        />
      )}

      {/* ---------- تأكيد الحذف ---------- */}
      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ padding: '1rem' }}>
          <div
            onClick={() => !deleteBusy && setDeleting(null)}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />
          <div
            className="relative w-full max-w-md rounded-3xl border border-line bg-navy-light text-center shadow-2xl shadow-black/60"
            style={{ padding: '2rem 1.5rem' }}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15 text-2xl">
              🗑️
            </span>
            <h3 className="text-xl font-extrabold text-white" style={{ marginBlock: '1rem 0.5rem' }}>
              حذف الشقة؟
            </h3>
            <p className="text-muted">
              هتتحذف «{deleting.name_ar}» نهائياً ومينفعش ترجعها. لو عاوز تخفيها بس، اقفل زرار «ظاهرة».
            </p>

            {deleteError && (
              <p
                className="rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-300"
                style={{ padding: '0.7rem 1rem', marginBlockStart: '1rem' }}
              >
                {deleteError}
              </p>
            )}

            <div className="flex gap-3" style={{ marginBlockStart: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={deleteBusy}
                style={{ padding: '0.7rem 1rem' }}
                className="flex-1 rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteBusy}
                style={{ padding: '0.7rem 1rem' }}
                className="flex-1 rounded-xl bg-red-500 font-bold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {deleteBusy ? 'جاري الحذف...' : 'أيوه، احذف'}
              </button>
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