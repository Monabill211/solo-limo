'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { catalogError, isCatalogMoney, newCatalogId, saveCatalogRecord } from '@/app/lib/supabase/admin-catalog';

type Target = 'car' | 'apartment' | 'airport' | null;

type Extra = {
  id: string;
  name_ar: string;
  name_en: string;
  applies_to: Target;
  price_egp: number;
  price_usd: number;
  per_day: boolean;
  active: boolean;
  cost_egp: number | null;
};

type Filter = 'all' | 'general' | 'car' | 'apartment' | 'airport';

const money = (n: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
const usd = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const TARGET_LABEL: Record<'general' | 'car' | 'apartment' | 'airport', string> = {
  general: 'كل الخدمات',
  car: 'سيارات',
  apartment: 'شقق',
  airport: 'مطار',
};

const keyOf = (t: Target) => (t ?? 'general') as 'general' | 'car' | 'apartment' | 'airport';

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted/60 transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

const STARTERS = [
  { name_ar: 'سائق خاص', name_en: 'Private driver', applies_to: 'car', per_day: true, price_egp: 1000, price_usd: 21, cost: 500 },
  { name_ar: 'كرسي أطفال', name_en: 'Child seat', applies_to: 'car', per_day: true, price_egp: 100, price_usd: 2, cost: 30 },
  { name_ar: 'استقبال من المطار', name_en: 'Airport pickup', applies_to: null, per_day: false, price_egp: 800, price_usd: 17, cost: 400 },
  { name_ar: 'تنظيف إضافي', name_en: 'Extra cleaning', applies_to: 'apartment', per_day: false, price_egp: 300, price_usd: 7, cost: 120 },
  { name_ar: 'مساعدة إضافية في الحقائب', name_en: 'Extra luggage assistance', applies_to: 'airport', per_day: false, price_egp: 150, price_usd: 3, cost: 50 },
] as const;

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-white/85">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

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
      <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'right-1' : 'right-6'}`} />
    </button>
  );
}

/* ================= النموذج ================= */
function ExtraForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Extra | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;

  const [f, setF] = useState({
    name_ar: initial?.name_ar ?? '',
    name_en: initial?.name_en ?? '',
    applies_to: (initial?.applies_to ?? 'general') as 'general' | 'car' | 'apartment' | 'airport',
    per_day: initial?.per_day ?? false,
    price_egp: initial?.price_egp?.toString() ?? '',
    price_usd: initial?.price_usd?.toString() ?? '',
    cost_egp: initial?.cost_egp?.toString() ?? '',
    active: initial?.active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, saving]);

  const recordId = useRef(initial?.id);
  const busy = useRef(false);
  const noPerDay = f.applies_to === 'airport';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setError('');

    const priceEgp = Number(f.price_egp);
    const priceUsd = Number(f.price_usd);
    const cost = f.cost_egp.trim() === '' ? null : Number(f.cost_egp);

    if (!f.name_ar.trim() || !f.name_en.trim()) return setError('اكتب اسم الإضافة بالعربي والإنجليزي.');
    if (f.price_egp === '' || f.price_usd === '' || !isCatalogMoney(priceEgp) || !isCatalogMoney(priceUsd))
      return setError('اكتب السعر بالجنيه وبالدولار.');
    if (cost !== null && !isCatalogMoney(cost)) return setError('التكلفة لازم تكون رقم صحيح.');

    const payload = {
      name_ar: f.name_ar.trim(),
      name_en: f.name_en.trim(),
      applies_to: f.applies_to === 'general' ? null : f.applies_to,
      per_day: noPerDay ? false : f.per_day,
      price_egp: priceEgp,
      price_usd: priceUsd,
      active: f.active,
    };

    busy.current = true;
    setSaving(true);
    try {
      recordId.current ??= newCatalogId();
      const error = await saveCatalogRecord('extras', recordId.current, isEdit, payload, cost);
      if (error) setError(error);
      else onSaved();
    } catch (error) {
      setError(catalogError(error));
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  const profit =
    f.price_egp !== '' && f.cost_egp !== '' ? Number(f.price_egp) - Number(f.cost_egp) : null;
  const unit = f.per_day && !noPerDay ? 'لليوم/الليلة' : 'للمرة';

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div onClick={() => !saving && onClose()} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />

      <form
        onSubmit={onSubmit}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-navy-light shadow-2xl shadow-black/60 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line" style={{ padding: '1rem 1.25rem' }}>
          <h2 className="text-xl font-extrabold text-white">{isEdit ? 'تعديل الإضافة' : 'إضافة جديدة'}</h2>
          <button type="button" onClick={onClose} disabled={saving} aria-label="إغلاق" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:border-gold hover:text-gold-light">
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto" style={{ padding: '1.25rem' }}>
          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50" style={{ padding: '1.25rem' }}>
            <h3 className="font-bold text-gold">الاسم</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم (عربي) *">
                <input value={f.name_ar} onChange={(e) => set('name_ar', e.target.value)} placeholder="سائق خاص" style={{ padding: '0.75rem 1rem' }} className={inputClass} />
              </Field>
              <Field label="الاسم (إنجليزي) *">
                <input dir="ltr" value={f.name_en} onChange={(e) => set('name_en', e.target.value)} placeholder="Private driver" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50" style={{ padding: '1.25rem' }}>
            <div>
              <h3 className="font-bold text-gold">بتظهر مع إيه؟</h3>
              <p className="text-sm text-muted" style={{ marginBlockStart: '0.25rem' }}>
                الإضافة بتظهر للعميل في الحجز الخاص بالنوع اللي تختاره بس.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(['general', 'car', 'apartment', 'airport'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('applies_to', k)}
                  style={{ padding: '0.7rem 0.5rem' }}
                  className={`flex flex-col items-center gap-1 rounded-xl border text-sm font-bold transition ${
                    f.applies_to === k
                      ? 'border-gold bg-gold/15 text-gold-light'
                      : 'border-line text-muted hover:border-gold/60 hover:text-white'
                  }`}
                >
                  {TARGET_LABEL[k]}
                </button>
              ))}
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={f.per_day && !noPerDay}
              disabled={noPerDay}
              onClick={() => set('per_day', !f.per_day)}
              className="flex items-center justify-between gap-4 rounded-xl border border-line bg-navy text-start transition hover:border-gold/60 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ padding: '0.85rem 1rem' }}
            >
              <span className="flex flex-col gap-0.5">
                <span className="font-bold text-white">يتحسب لكل يوم / ليلة</span>
                <span className="text-sm text-muted">
                  {noPerDay
                    ? 'خدمة المطار بتكون ليوم واحد، فالإضافة بتتحسب مرة.'
                    : f.per_day
                      ? 'السعر بيتضرب في عدد الأيام أو الليالي (زي السائق).'
                      : 'السعر بيتحسب مرة واحدة على الحجز كله.'}
                </span>
              </span>
              <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${f.per_day && !noPerDay ? 'bg-gold' : 'bg-line'}`}>
                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${f.per_day && !noPerDay ? 'right-1' : 'right-6'}`} />
              </span>
            </button>
          </section>

          <section className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50" style={{ padding: '1.25rem' }}>
            <h3 className="font-bold text-gold">السعر والتكلفة ({unit})</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="السعر بالجنيه *">
                <input type="number" dir="ltr" min={0} step="0.01" value={f.price_egp} onChange={(e) => set('price_egp', e.target.value)} placeholder="100" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
              <Field label="السعر بالدولار *">
                <input type="number" dir="ltr" min={0} step="0.01" value={f.price_usd} onChange={(e) => set('price_usd', e.target.value)} placeholder="2" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
              <Field label="التكلفة بالجنيه" hint="مخفية عن العملاء، للماليات بس">
                <input type="number" dir="ltr" min={0} step="0.01" value={f.cost_egp} onChange={(e) => set('cost_egp', e.target.value)} placeholder="30" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
            </div>

            {profit !== null && !Number.isNaN(profit) && (
              <p
                className={`rounded-xl border text-sm font-bold ${
                  profit >= 0 ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}
                style={{ padding: '0.7rem 1rem' }}
              >
                الربح المتوقع ({unit}): {money(profit)}
              </p>
            )}
          </section>

          <button
            type="button"
            role="switch"
            aria-checked={f.active}
            onClick={() => set('active', !f.active)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-navy/50 text-start transition hover:border-gold/60"
            style={{ padding: '1rem 1.25rem' }}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-bold text-white">إظهار الإضافة للعملاء</span>
              <span className="text-sm text-muted">{f.active ? 'ظاهرة في صفحة الحجز' : 'مخفية، مش هتظهر للعملاء'}</span>
            </span>
            <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${f.active ? 'bg-gold' : 'bg-line'}`}>
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${f.active ? 'right-1' : 'right-6'}`} />
            </span>
          </button>

          {error && (
            <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300" style={{ padding: '0.75rem 1rem' }}>
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-line bg-navy-light sm:flex-row sm:justify-end" style={{ padding: '1rem 1.25rem' }}>
          <button type="button" onClick={onClose} disabled={saving} style={{ padding: '0.75rem 1.75rem' }} className="rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light">
            إلغاء
          </button>
          <button type="submit" disabled={saving} style={{ padding: '0.75rem 2rem' }} className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================= الصفحة ================= */
export default function AdminExtrasPage() {
  const [items, setItems] = useState<Extra[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Extra | null>(null);
  const [deleting, setDeleting] = useState<Extra | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await createClient()
      .from('extras')
      .select('*, costs(cost_egp)')
      .order('created_at', { ascending: true });

    if (err) {
      setError('مقدرناش نحمّل الإضافات: ' + err.message);
      setItems([]);
    } else {
      setItems(
        (data ?? []).map((x: any) => {
          const cost = Array.isArray(x.costs) ? x.costs[0]?.cost_egp : x.costs?.cost_egp;
          return {
            ...x,
            price_egp: Number(x.price_egp),
            price_usd: Number(x.price_usd),
            cost_egp: cost === undefined || cost === null ? null : Number(cost),
          } as Extra;
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

  async function toggleActive(x: Extra) {
    const next = !x.active;
    setItems((p) => p.map((i) => (i.id === x.id ? { ...i, active: next } : i)));

    const { error: err } = await createClient().from('extras').update({ active: next }).eq('id', x.id).select('id').single();
    if (err) {
      setItems((p) => p.map((i) => (i.id === x.id ? { ...i, active: !next } : i)));
      showToast(err.message);
    } else {
      showToast(next ? 'الإضافة بقت ظاهرة للعملاء' : 'الإضافة اتخبّت');
    }
  }

  async function addStarters() {
    setBusy(true);
    try {
      const { error } = await createClient().rpc('save_catalog_extras', {
        p_items: STARTERS.map((item) => ({ ...item, id: newCatalogId(), active: true })),
      });
      if (error) throw error;
      showToast('تمت إضافة الإضافات الجاهزة ✓');
      void load();
    } catch (error) {
      showToast(catalogError(error));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');

    const { error: err } = await createClient().from('extras').delete().eq('id', deleting.id).select('id').single();

    if (err) {
      setDeleteError(
        err.code === '23503'
          ? 'الإضافة دي اتستخدمت في حجوزات فمينفعش تتحذف. اقفل زرار الإظهار عشان تخفيها بدل الحذف.'
          : err.message
      );
      setDeleteBusy(false);
      return;
    }

    setDeleteBusy(false);
    setDeleting(null);
    showToast('تم حذف الإضافة');
    load();
  }

  const counts = useMemo(() => {
    const c = { all: items.length, general: 0, car: 0, apartment: 0, airport: 0 };
    items.forEach((x) => (c[keyOf(x.applies_to)] += 1));
    return c;
  }, [items]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (filter !== 'all' && keyOf(x.applies_to) !== filter) return false;
      if (!q) return true;
      return `${x.name_ar} ${x.name_en}`.toLowerCase().includes(q);
    });
  }, [items, query, filter]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (x: Extra) => {
    setEditing(x);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">الإضافات</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
            خدمات إضافية (سائق، كرسي أطفال...) بتظهر للعميل أثناء الحجز وبتتضاف على الإجمالي.
          </p>
        </div>

        <button type="button" onClick={openAdd} style={{ padding: '0.75rem 1.5rem' }} className="flex items-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40">
          إضافة جديدة
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث باسم الإضافة..."
          style={{ padding: '0.75rem 1rem' }}
          className="w-full rounded-xl border border-line bg-navy-light text-white placeholder:text-muted/60 focus:border-gold focus:outline-none md:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'الكل'],
              ['general', 'عامة'],
              ['car', 'سيارات'],
              ['apartment', 'شقق'],
              ['airport', 'مطار'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{ padding: '0.45rem 1.05rem' }}
              className={`rounded-full border text-sm font-bold transition ${
                filter === k ? 'border-gold bg-gold text-navy' : 'border-line text-muted hover:border-gold hover:text-gold-light'
              }`}
            >
              {label} ({counts[k]})
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300" style={{ padding: '0.8rem 1rem' }}>
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl border border-line bg-navy-light" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center" style={{ padding: '3.5rem 1.5rem' }}>
          <p className="text-xl font-bold text-white">{items.length === 0 ? 'لسه مفيش إضافات' : 'مفيش نتائج'}</p>
          <p className="text-muted">
            {items.length === 0 ? 'ابدأ بالإضافات الجاهزة وعدّل عليها، أو أضف إضافة من الصفر.' : 'جرّب كلمة تانية أو غيّر الفلتر.'}
          </p>
          {items.length === 0 && (
            <div className="flex flex-wrap justify-center gap-3" style={{ marginBlockStart: '0.5rem' }}>
              <button type="button" onClick={addStarters} disabled={busy} style={{ padding: '0.7rem 1.75rem' }} className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy disabled:opacity-60">
                {busy ? 'جاري الإضافة...' : 'إضافة الإضافات الجاهزة'}
              </button>
              <button type="button" onClick={openAdd} style={{ padding: '0.7rem 1.75rem' }} className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy">
                إضافة جديدة
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((x) => {
            const k = keyOf(x.applies_to);
            const profit = x.cost_egp !== null ? x.price_egp - x.cost_egp : null;
            return (
              <div
                key={x.id}
                className={`flex flex-col gap-4 rounded-2xl border bg-navy-light transition hover:border-gold/60 ${x.active ? 'border-line' : 'border-line opacity-70'}`}
                style={{ padding: '1.1rem' }}
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{x.name_ar}</p>
                    <p dir="ltr" className="truncate text-start text-sm text-muted">{x.name_en}</p>
                  </div>
                  <Switch on={x.active} onClick={() => toggleActive(x)} label="إظهار الإضافة" />
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-line text-xs font-bold text-muted" style={{ padding: '0.15rem 0.7rem' }}>
                    {TARGET_LABEL[k]}
                  </span>
                  <span
                    className={`rounded-full border text-xs font-bold ${
                      x.per_day ? 'border-gold/40 bg-gold/10 text-gold-light' : 'border-line text-muted'
                    }`}
                    style={{ padding: '0.15rem 0.7rem' }}
                  >
                    {x.per_day ? 'لكل يوم / ليلة' : 'مرة واحدة'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                    <p className="text-xs text-muted">السعر</p>
                    <p className="font-bold text-white">{money(x.price_egp)}</p>
                    <p className="text-xs text-muted">{usd(x.price_usd)}</p>
                  </div>
                  <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                    <p className="text-xs text-muted">الربح</p>
                    {profit !== null ? (
                      <p className={`font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{money(profit)}</p>
                    ) : (
                      <p className="text-muted">مش متسجّل</p>
                    )}
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(x)} style={{ padding: '0.4rem 1.1rem' }} className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy">
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError('');
                      setDeleting(x);
                    }}
                    style={{ padding: '0.4rem 1.1rem' }}
                    className="rounded-lg border border-red-500/40 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && (
        <ExtraForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            showToast(editing ? 'تم حفظ التعديلات ✓' : 'تمت إضافة الإضافة ✓');
            load();
          }}
        />
      )}

      {deleting && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ padding: '1rem' }}>
          <div onClick={() => !deleteBusy && setDeleting(null)} className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-3xl border border-line bg-navy-light text-center shadow-2xl shadow-black/60" style={{ padding: '2rem 1.5rem' }}>
            <h3 className="text-xl font-extrabold text-white" style={{ marginBlock: '1rem 0.5rem' }}>حذف الإضافة؟</h3>
            <p className="text-muted">هتتحذف «{deleting.name_ar}» نهائياً. لو عاوز تخفيها بس، اقفل زرار الإظهار.</p>

            {deleteError && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 text-sm text-red-300" style={{ padding: '0.7rem 1rem', marginBlockStart: '1rem' }}>
                {deleteError}
              </p>
            )}

            <div className="flex gap-3" style={{ marginBlockStart: '1.5rem' }}>
              <button type="button" onClick={() => setDeleting(null)} disabled={deleteBusy} style={{ padding: '0.7rem 1rem' }} className="flex-1 rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light">
                إلغاء
              </button>
              <button type="button" onClick={confirmDelete} disabled={deleteBusy} style={{ padding: '0.7rem 1rem' }} className="flex-1 rounded-xl bg-red-500 font-bold text-white transition hover:bg-red-600 disabled:opacity-60">
                {deleteBusy ? 'جاري الحذف...' : 'أيوه، احذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed bottom-5 left-1/2 z-[70] -translate-x-1/2 rounded-xl border border-gold/50 bg-navy-light font-bold text-gold-light shadow-2xl shadow-black/50" style={{ padding: '0.75rem 1.5rem' }}>
          {toast}
        </div>
      )}
    </div>
  );
}