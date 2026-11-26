'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';
import CarForm, { type CarRow } from '../../components/admin/carform';

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

export default function AdminCarsPage() {
  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CarRow | null>(null);
  const [deleting, setDeleting] = useState<CarRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await createClient()
      .from('cars')
      .select('*, costs(cost_egp)')
      .order('created_at', { ascending: false });

    if (err) {
      setError('مقدرناش نحمّل السيارات: ' + err.message);
      setCars([]);
    } else {
      setCars(
        (data ?? []).map((c: any) => {
          const cost = Array.isArray(c.costs) ? c.costs[0]?.cost_egp : c.costs?.cost_egp;
          return {
            ...c,
            price_egp: Number(c.price_egp),
            price_usd: Number(c.price_usd),
            images: c.images ?? [],
            cost_egp: cost === undefined || cost === null ? null : Number(cost),
          } as CarRow;
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

  async function toggleActive(car: CarRow) {
    const next = !car.active;
    setCars((p) => p.map((c) => (c.id === car.id ? { ...c, active: next } : c)));

    const { error: err } = await createClient().from('cars').update({ active: next }).eq('id', car.id).select('id').single();
    if (err) {
      setCars((p) => p.map((c) => (c.id === car.id ? { ...c, active: !next } : c)));
      showToast(err.message);
    } else {
      showToast(next ? 'السيارة بقت ظاهرة في الموقع' : 'السيارة اتخبّت من الموقع');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');

    const { error: err } = await createClient().from('cars').delete().eq('id', deleting.id).select('id').single();

    if (err) {
      setDeleteError(err.message);
      setDeleteBusy(false);
      return;
    }

    setDeleteBusy(false);
    setDeleting(null);
    showToast('تم حذف السيارة');
    load();
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cars.filter((c) => {
      if (filter === 'active' && !c.active) return false;
      if (filter === 'hidden' && c.active) return false;
      if (!q) return true;
      return `${c.name_ar} ${c.name_en} ${c.brand ?? ''} ${c.model ?? ''}`.toLowerCase().includes(q);
    });
  }, [cars, query, filter]);

  const counts = {
    all: cars.length,
    active: cars.filter((c) => c.active).length,
    hidden: cars.filter((c) => !c.active).length,
  };

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (c: CarRow) => {
    setEditing(c);
    setFormOpen(true);
  };

  const Thumb = ({ car }: { car: CarRow }) =>
    car.images[0] ? (
      <img src={car.images[0]} alt={car.name_ar} className="h-16 w-24 shrink-0 rounded-xl object-cover" />
    ) : (
      <span className="h-16 w-24 shrink-0 rounded-xl border border-line bg-navy" aria-hidden="true" />
    );

  const Actions = ({ car }: { car: CarRow }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openEdit(car)}
        style={{ padding: '0.4rem 1rem' }}
        className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
      >
        تعديل
      </button>
      <button
        type="button"
        onClick={() => {
          setDeleteError('');
          setDeleting(car);
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
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">السيارات</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
            أضف وعدّل أسطول السيارات وأسعارها وتكلفتها.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          style={{ padding: '0.75rem 1.5rem' }}
          className="flex items-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
        >
          إضافة سيارة
        </button>
      </div>

      {/* ---------- البحث والفلتر ---------- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم السيارة أو الماركة..."
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
          <p className="text-xl font-bold text-white">
            {cars.length === 0 ? 'لسه مفيش سيارات' : 'مفيش نتائج للبحث'}
          </p>
          <p className="text-muted">
            {cars.length === 0 ? 'ابدأ بإضافة أول سيارة في الأسطول.' : 'جرّب كلمة تانية أو غيّر الفلتر.'}
          </p>
          {cars.length === 0 && (
            <button
              type="button"
              onClick={openAdd}
              style={{ padding: '0.7rem 1.75rem', marginBlockStart: '0.5rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
            >
              إضافة سيارة
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
                  {['السيارة', 'السعر لليوم', 'التكلفة والربح', 'ظاهرة', ''].map((h, i) => (
                    <th key={i} className="text-start font-bold" style={{ padding: '0.9rem 1rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((c) => {
                  const profit = c.cost_egp !== null ? c.price_egp - c.cost_egp : null;
                  return (
                    <tr key={c.id} className="border-b border-line/60 transition hover:bg-navy/50">
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <div className="flex items-center gap-4">
                          <Thumb car={c} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{c.name_ar}</p>
                            <p dir="ltr" className="truncate text-start text-sm text-muted">
                              {c.name_en}
                            </p>
                            <p className="text-xs text-muted">
                              {[c.brand, c.model, c.year, c.seats && `${c.seats} مقاعد`]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <p className="font-bold text-white">{money(c.price_egp)}</p>
                        <p className="text-sm text-muted">{usd(c.price_usd)}</p>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        {c.cost_egp !== null ? (
                          <>
                            <p className="text-sm text-muted">التكلفة: {money(c.cost_egp)}</p>
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
                        <Switch on={c.active} onClick={() => toggleActive(c)} label="إظهار السيارة" />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Actions car={c} />
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
              const profit = c.cost_egp !== null ? c.price_egp - c.cost_egp : null;
              return (
                <div
                  key={c.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-navy-light"
                  style={{ padding: '1rem' }}
                >
                  <div className="flex items-center gap-3">
                    <Thumb car={c} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{c.name_ar}</p>
                      <p dir="ltr" className="truncate text-start text-sm text-muted">
                        {c.name_en}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {[c.brand, c.model, c.year].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                    <Switch on={c.active} onClick={() => toggleActive(c)} label="إظهار السيارة" />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">السعر لليوم</p>
                      <p className="font-bold text-white">{money(c.price_egp)}</p>
                      <p className="text-xs text-muted">{usd(c.price_usd)}</p>
                    </div>
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted">الربح لليوم</p>
                      {profit !== null ? (
                        <p className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {money(profit)}
                        </p>
                      ) : (
                        <p className="text-muted">مش متسجّل</p>
                      )}
                    </div>
                  </div>

                  <Actions car={c} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- النموذج ---------- */}
      {formOpen && (
        <CarForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            showToast(editing ? 'تم حفظ التعديلات ✓' : 'تمت إضافة السيارة ✓');
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
            <h3 className="text-xl font-extrabold text-white" style={{ marginBlock: '1rem 0.5rem' }}>
              حذف السيارة؟
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