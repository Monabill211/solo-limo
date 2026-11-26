'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

type Customer = {
  id: string;
  full_name: string | null;
  phone: string | null;
  customer_code: string;
};

type Discount = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  customer_id: string | null;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  created_at: string;
  customer: Customer | null;
};

type Status = 'active' | 'disabled' | 'expired' | 'exhausted';
type Filter = 'all' | Status;

const LOC = 'ar-EG';
const money = (n: number) =>
  new Intl.NumberFormat(LOC, { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);
const dateAr = (iso: string) =>
  new Intl.DateTimeFormat(LOC, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

const STATUS_LABEL: Record<Status, string> = {
  active: 'شغّال',
  disabled: 'متوقف',
  expired: 'منتهي',
  exhausted: 'اتستهلك',
};

const STATUS_STYLE: Record<Status, string> = {
  active: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  disabled: 'border-line bg-white/5 text-muted',
  expired: 'border-red-500/40 bg-red-500/10 text-red-300',
  exhausted: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
};

function statusOf(d: Discount): Status {
  if (!d.active) return 'disabled';
  if (d.expires_at && new Date(d.expires_at) < new Date()) return 'expired';
  if (d.max_uses !== null && d.used_count >= d.max_uses) return 'exhausted';
  return 'active';
}

const valueLabel = (d: Pick<Discount, 'type' | 'value'>) =>
  d.type === 'percent' ? `${d.value}%` : money(d.value);

function randomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `SOLO-${s}`;
}

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted/60 transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
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
      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${
          on ? 'right-1' : 'right-6'
        }`}
      />
    </button>
  );
}

/* ================= النموذج ================= */
function DiscountForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Discount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;

  const [f, setF] = useState({
    code: initial?.code ?? '',
    type: (initial?.type ?? 'percent') as 'percent' | 'fixed',
    value: initial?.value?.toString() ?? '',
    expires: initial?.expires_at ? new Date(initial.expires_at).toLocaleDateString('sv-SE') : '',
    max_uses: initial?.max_uses?.toString() ?? '',
    active: initial?.active ?? true,
  });
  const [customer, setCustomer] = useState<Customer | null>(initial?.customer ?? null);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
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

  async function searchCustomer() {
    const term = q.replace(/[,()]/g, ' ').trim();
    if (!term) return;
    setSearching(true);
    setSearched(false);

    const { data } = await createClient()
      .from('profiles')
      .select('id, full_name, phone, customer_code')
      .or(`customer_code.eq.${term.toUpperCase()},phone.ilike.%${term}%,full_name.ilike.%${term}%`)
      .limit(5);

    setResults((data ?? []) as Customer[]);
    setSearching(false);
    setSearched(true);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const code = f.code.trim().toUpperCase().replace(/\s+/g, '');
    const value = Number(f.value);
    const maxUses = f.max_uses.trim() === '' ? null : Number(f.max_uses);

    if (!code) return setError('اكتب كود الخصم أو دوس "توليد كود".');
    if (!/^[A-Z0-9_-]+$/.test(code)) return setError('الكود لازم يكون حروف إنجليزية وأرقام وشرطة بس.');
    if (!f.value || Number.isNaN(value) || value <= 0) return setError('اكتب قيمة الخصم.');
    if (f.type === 'percent' && value > 100) return setError('النسبة لازم تكون من 1 لـ 100.');
    if (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1))
      return setError('عدد مرات الاستخدام لازم يكون رقم صحيح من 1 فوق.');
    if (isEdit && maxUses !== null && maxUses < (initial?.used_count ?? 0))
      return setError(`الكود اتستخدم ${initial?.used_count} مرة، فالحد الأقصى مينفعش يبقى أقل من كده.`);

    setSaving(true);

    const payload = {
      code,
      type: f.type,
      value,
      customer_id: customer?.id ?? null,
      expires_at: f.expires ? new Date(`${f.expires}T23:59:59`).toISOString() : null,
      max_uses: maxUses,
      active: f.active,
    };

    const supabase = createClient();
    const { error: err } = isEdit
      ? await supabase.from('discount_codes').update(payload).eq('id', initial!.id).select('id').single()
      : await supabase.from('discount_codes').insert(payload).select('id').single();

    if (err) {
      setError(
        err.code === '23505'
          ? 'الكود ده موجود قبل كده، اختار كود تاني.'
          : err.code === '42501'
            ? 'الحساب ده ملوش صلاحية التعديل. اتأكد إنه أدمن.'
            : err.message
      );
      setSaving(false);
      return;
    }

    onSaved();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <form
        onSubmit={onSubmit}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-line bg-navy-light shadow-2xl shadow-black/60 sm:rounded-3xl"
      >
        <div
          className="flex items-center justify-between gap-3 border-b border-line"
          style={{ padding: '1rem 1.25rem' }}
        >
          <h2 className="text-xl font-extrabold text-white">
            {isEdit ? 'تعديل كود الخصم' : 'كود خصم جديد'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition hover:border-gold hover:text-gold-light"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto" style={{ padding: '1.25rem' }}>
          {/* الكود */}
          <section
            className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50"
            style={{ padding: '1.25rem' }}
          >
            <h3 className="font-bold text-gold">الكود</h3>
            <Field label="كود الخصم *" hint="حروف إنجليزية وأرقام وشرطة، والعميل بيكتبه في صفحة الدفع.">
              <div className="flex gap-2">
                <input
                  dir="ltr"
                  value={f.code}
                  onChange={(e) => set('code', e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start font-bold tracking-widest`}
                />
                <button
                  type="button"
                  onClick={() => set('code', randomCode())}
                  style={{ padding: '0.75rem 1.1rem' }}
                  className="shrink-0 rounded-xl border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
                >
                  توليد كود
                </button>
              </div>
            </Field>
          </section>

          {/* القيمة */}
          <section
            className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50"
            style={{ padding: '1.25rem' }}
          >
            <h3 className="font-bold text-gold">قيمة الخصم</h3>

            <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-navy" style={{ padding: '0.3rem' }}>
              {(
                [
                  ['percent', 'نسبة مئوية %'],
                  ['fixed', 'مبلغ ثابت'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => set('type', k)}
                  style={{ padding: '0.6rem 0.5rem' }}
                  className={`rounded-lg font-bold transition ${
                    f.type === k ? 'bg-gold text-navy shadow-md shadow-gold/30' : 'text-muted hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <Field
              label={f.type === 'percent' ? 'نسبة الخصم (من 1 لـ 100) *' : 'قيمة الخصم بالجنيه *'}
              hint={f.type === 'fixed' ? 'المبلغ بالجنيه، ولو العميل بيدفع بالدولار بيتحوّل بسعر الصرف.' : undefined}
            >
              <div className="relative">
                <input
                  type="number"
                  dir="ltr"
                  min={1}
                  max={f.type === 'percent' ? 100 : undefined}
                  value={f.value}
                  onChange={(e) => set('value', e.target.value)}
                  placeholder={f.type === 'percent' ? '10' : '200'}
                  style={{ padding: '0.75rem 3.5rem 0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
                <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gold">
                  {f.type === 'percent' ? '%' : 'ج.م'}
                </span>
              </div>
            </Field>
          </section>

          {/* العميل */}
          <section
            className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50"
            style={{ padding: '1.25rem' }}
          >
            <div>
              <h3 className="font-bold text-gold">لعميل معيّن (اختياري)</h3>
              <p className="text-sm text-muted" style={{ marginBlockStart: '0.25rem' }}>
                لو ربطته بعميل، هو بس اللي يقدر يستخدم الكود. سيبه فاضي لو الكود للكل.
              </p>
            </div>

            {customer ? (
              <div
                className="flex items-center justify-between gap-3 rounded-xl border border-gold/40 bg-gold/10"
                style={{ padding: '0.8rem 1rem' }}
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{customer.full_name || 'بدون اسم'}</p>
                  <p dir="ltr" className="truncate text-start text-sm text-muted">
                    {customer.customer_code} · {customer.phone || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomer(null)}
                  style={{ padding: '0.35rem 0.9rem' }}
                  className="shrink-0 rounded-lg border border-red-500/40 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
                >
                  إزالة
                </button>
              </div>
            ) : (
              <>
                <div className="flex gap-2">
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchCustomer();
                      }
                    }}
                    placeholder="كود العميل أو رقم التليفون أو الاسم"
                    style={{ padding: '0.7rem 1rem' }}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={searchCustomer}
                    disabled={searching}
                    style={{ padding: '0.7rem 1.25rem' }}
                    className="shrink-0 rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy disabled:opacity-60"
                  >
                    {searching ? '...' : 'بحث'}
                  </button>
                </div>

                {searched && results.length === 0 && (
                  <p className="text-sm text-muted">مفيش عميل بالبيانات دي.</p>
                )}

                {results.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {results.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setCustomer(c);
                          setResults([]);
                          setQ('');
                        }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-line bg-navy text-start transition hover:border-gold"
                        style={{ padding: '0.7rem 1rem' }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-bold text-white">
                            {c.full_name || 'بدون اسم'}
                          </span>
                          <span dir="ltr" className="block truncate text-start text-xs text-muted">
                            {c.customer_code} · {c.phone || '—'}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-gold">اختيار</span>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          {/* القيود */}
          <section
            className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50"
            style={{ padding: '1.25rem' }}
          >
            <h3 className="font-bold text-gold">القيود</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="تاريخ الانتهاء" hint="سيبه فاضي لو الكود مالوش انتهاء.">
                <input
                  type="date"
                  dir="ltr"
                  value={f.expires}
                  onChange={(e) => set('expires', e.target.value)}
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field
                label="أقصى عدد استخدامات"
                hint={isEdit ? `اتستخدم ${initial?.used_count} مرة لحد دلوقتي.` : 'سيبه فاضي لو مفيش حد أقصى.'}
              >
                <input
                  type="number"
                  dir="ltr"
                  min={1}
                  value={f.max_uses}
                  onChange={(e) => set('max_uses', e.target.value)}
                  placeholder="مثال: 50"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
            </div>
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
              <span className="font-bold text-white">تفعيل الكود</span>
              <span className="text-sm text-muted">
                {f.active ? 'العملاء يقدروا يستخدموه' : 'متوقف، مش هيشتغل'}
              </span>
            </span>
            <span
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                f.active ? 'bg-gold' : 'bg-line'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  f.active ? 'right-1' : 'right-6'
                }`}
              />
            </span>
          </button>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300"
              style={{ padding: '0.75rem 1rem' }}
            >
              {error}
            </p>
          )}
        </div>

        <div
          className="flex flex-col-reverse gap-3 border-t border-line bg-navy-light sm:flex-row sm:justify-end"
          style={{ padding: '1rem 1.25rem' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{ padding: '0.75rem 1.75rem' }}
            className="rounded-xl border border-line font-bold text-muted transition hover:border-gold hover:text-gold-light"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{ padding: '0.75rem 2rem' }}
            className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الكود'}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ================= الصفحة ================= */
export default function AdminDiscountsPage() {
  const [items, setItems] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [deleting, setDeleting] = useState<Discount | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    const { data, error: err } = await createClient()
      .from('discount_codes')
      .select('*, customer:profiles!customer_id(id, full_name, phone, customer_code)')
      .order('created_at', { ascending: false });

    if (err) {
      setError('مقدرناش نحمّل الأكواد: ' + err.message);
      setItems([]);
    } else {
      setItems(
        (data ?? []).map((d: any) => ({
          ...d,
          value: Number(d.value),
          used_count: d.used_count ?? 0,
          customer: Array.isArray(d.customer) ? (d.customer[0] ?? null) : (d.customer ?? null),
        })) as Discount[]
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

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      showToast(`تم نسخ الكود ${code}`);
    } catch {
      showToast('معرفناش ننسخ، انسخه يدوي.');
    }
  }

  async function toggleActive(d: Discount) {
    const next = !d.active;
    setItems((p) => p.map((x) => (x.id === d.id ? { ...x, active: next } : x)));

    const { error: err } = await createClient()
      .from('discount_codes')
      .update({ active: next })
      .eq('id', d.id).select('id').single();

    if (err) {
      setItems((p) => p.map((x) => (x.id === d.id ? { ...x, active: !next } : x)));
      showToast(err.message);
    } else {
      showToast(next ? 'الكود اتفعّل' : 'الكود اتوقّف');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError('');

    const { error: err } = await createClient().from('discount_codes').delete().eq('id', deleting.id).select('id').single();

    if (err) {
      setDeleteError(
        err.code === '23503'
          ? 'الكود ده اتستخدم في حجوزات فمينفعش يتحذف. وقّفه بزرار التفعيل بدل الحذف.'
          : err.message
      );
      setDeleteBusy(false);
      return;
    }

    setDeleteBusy(false);
    setDeleting(null);
    showToast('تم حذف الكود');
    load();
  }

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((d) => {
      if (filter !== 'all' && statusOf(d) !== filter) return false;
      if (!q) return true;
      return `${d.code} ${d.customer?.full_name ?? ''} ${d.customer?.customer_code ?? ''} ${d.customer?.phone ?? ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [items, query, filter]);

  const counts = useMemo(() => {
    const c = { all: items.length, active: 0, disabled: 0, expired: 0, exhausted: 0 };
    items.forEach((d) => (c[statusOf(d)] += 1));
    return c;
  }, [items]);

  const totalUses = items.reduce((s, d) => s + d.used_count, 0);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (d: Discount) => {
    setEditing(d);
    setFormOpen(true);
  };

  const CodeChip = ({ d }: { d: Discount }) => (
    <button
      type="button"
      onClick={() => copy(d.code)}
      title="اضغط للنسخ"
      dir="ltr"
      style={{ padding: '0.35rem 0.9rem' }}
      className="rounded-lg border-2 border-dashed border-gold/60 font-extrabold tracking-widest text-gold-light transition hover:bg-gold/10"
    >
      {d.code}
    </button>
  );

  const Usage = ({ d }: { d: Discount }) => {
    const pct = d.max_uses ? Math.min(100, (d.used_count / d.max_uses) * 100) : 0;
    return (
      <div className="min-w-24">
        <p className="text-sm font-bold text-white">
          {d.used_count}
          <span className="font-normal text-muted"> / {d.max_uses ?? '∞'}</span>
        </p>
        {d.max_uses && (
          <div className="h-1.5 overflow-hidden rounded-full bg-line" style={{ marginBlockStart: '0.35rem' }}>
            <div
              className={`h-full rounded-full ${pct >= 100 ? 'bg-amber-400' : 'bg-gold'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  const Actions = ({ d }: { d: Discount }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => openEdit(d)}
        style={{ padding: '0.4rem 1rem' }}
        className="rounded-lg border border-gold/50 text-sm font-bold text-gold transition hover:bg-gold hover:text-navy"
      >
        تعديل
      </button>
      <button
        type="button"
        onClick={() => {
          setDeleteError('');
          setDeleting(d);
        }}
        style={{ padding: '0.4rem 1rem' }}
        className="rounded-lg border border-red-500/40 text-sm font-bold text-red-300 transition hover:bg-red-500 hover:text-white"
      >
        حذف
      </button>
    </div>
  );

  const Who = ({ d }: { d: Discount }) =>
    d.customer ? (
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{d.customer.full_name || 'بدون اسم'}</p>
        <p dir="ltr" className="truncate text-start text-xs text-muted">
          {d.customer.customer_code}
        </p>
      </div>
    ) : (
      <span className="text-sm text-muted">لكل العملاء</span>
    );

  const Expiry = ({ d }: { d: Discount }) =>
    d.expires_at ? (
      <span className={`text-sm ${new Date(d.expires_at) < new Date() ? 'text-red-300' : 'text-muted'}`}>
        {dateAr(d.expires_at)}
      </span>
    ) : (
      <span className="text-sm text-muted">من غير انتهاء</span>
    );

  return (
    <div className="flex flex-col gap-6">
      {/* ---------- العنوان ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">أكواد الخصم</h1>
          <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
            اعمل أكواد خصم وابعتها للعملاء، وتابع استخدامها.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          style={{ padding: '0.75rem 1.5rem' }}
          className="flex items-center gap-2 rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
        >
          كود جديد
        </button>
      </div>

      {/* ---------- الإحصائيات ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['كل الأكواد', counts.all, 'text-white'],
          ['الشغّالة', counts.active, 'text-emerald-300'],
          ['المنتهية والمتوقفة', counts.expired + counts.disabled + counts.exhausted, 'text-amber-300'],
          ['مرات الاستخدام', totalUses, 'text-gold-light'],
        ].map(([label, value, color]) => (
          <div
            key={label as string}
            className="rounded-2xl border border-line bg-navy-light"
            style={{ padding: '1rem 1.1rem' }}
          >
            <p className="text-sm text-muted">{label}</p>
            <p className={`text-2xl font-extrabold md:text-3xl ${color}`} style={{ marginBlockStart: '0.3rem' }}>
              {new Intl.NumberFormat(LOC).format(value as number)}
            </p>
          </div>
        ))}
      </div>

      {/* ---------- البحث والفلتر ---------- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالكود أو اسم العميل..."
          style={{ padding: '0.75rem 1rem' }}
          className="w-full rounded-xl border border-line bg-navy-light text-white placeholder:text-muted/60 focus:border-gold focus:outline-none lg:max-w-sm"
        />

        <div className="flex flex-wrap gap-2">
          {(
            [
              ['all', 'الكل'],
              ['active', 'شغّال'],
              ['expired', 'منتهي'],
              ['exhausted', 'اتستهلك'],
              ['disabled', 'متوقف'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setFilter(k)}
              style={{ padding: '0.45rem 1.05rem' }}
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
            <div key={i} className="h-20 animate-pulse rounded-2xl border border-line bg-navy-light" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <div
          className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
          style={{ padding: '3.5rem 1.5rem' }}
        >
          <p className="text-xl font-bold text-white">
            {items.length === 0 ? 'لسه مفيش أكواد خصم' : 'مفيش نتائج للبحث'}
          </p>
          <p className="text-muted">
            {items.length === 0 ? 'اعمل أول كود وابعته لعميلك.' : 'جرّب كلمة تانية أو غيّر الفلتر.'}
          </p>
          {items.length === 0 && (
            <button
              type="button"
              onClick={openAdd}
              style={{ padding: '0.7rem 1.75rem', marginBlockStart: '0.5rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy"
            >
              كود جديد
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
                  {['الكود', 'الخصم', 'العميل', 'الاستخدام', 'الانتهاء', 'الحالة', 'تفعيل', ''].map((h, i) => (
                    <th key={i} className="text-start font-bold" style={{ padding: '0.9rem 1rem' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((d) => {
                  const st = statusOf(d);
                  return (
                    <tr key={d.id} className="border-b border-line/60 transition hover:bg-navy/50">
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <CodeChip d={d} />
                      </td>
                      <td className="text-lg font-extrabold text-white" style={{ padding: '0.9rem 1rem' }}>
                        {valueLabel(d)}
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Who d={d} />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Usage d={d} />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Expiry d={d} />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <span
                          className={`rounded-full border text-xs font-bold ${STATUS_STYLE[st]}`}
                          style={{ padding: '0.25rem 0.8rem' }}
                        >
                          {STATUS_LABEL[st]}
                        </span>
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Switch on={d.active} onClick={() => toggleActive(d)} label="تفعيل الكود" />
                      </td>
                      <td style={{ padding: '0.9rem 1rem' }}>
                        <Actions d={d} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* كروت للموبايل والتابلت */}
          <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
            {list.map((d) => {
              const st = statusOf(d);
              return (
                <div
                  key={d.id}
                  className="flex flex-col gap-4 rounded-2xl border border-line bg-navy-light"
                  style={{ padding: '1rem' }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <CodeChip d={d} />
                    <span
                      className={`rounded-full border text-xs font-bold ${STATUS_STYLE[st]}`}
                      style={{ padding: '0.2rem 0.7rem' }}
                    >
                      {STATUS_LABEL[st]}
                    </span>
                  </div>

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-3xl font-extrabold text-white">{valueLabel(d)}</p>
                    <Switch on={d.active} onClick={() => toggleActive(d)} label="تفعيل الكود" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted" style={{ marginBlockEnd: '0.2rem' }}>العميل</p>
                      <Who d={d} />
                    </div>
                    <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.8rem' }}>
                      <p className="text-xs text-muted" style={{ marginBlockEnd: '0.2rem' }}>الاستخدام</p>
                      <Usage d={d} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted">ينتهي:</span>
                    <Expiry d={d} />
                  </div>

                  <Actions d={d} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ---------- النموذج ---------- */}
      {formOpen && (
        <DiscountForm
          initial={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            showToast(editing ? 'تم حفظ التعديلات' : 'تمت إضافة الكود');
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
              حذف الكود؟
            </h3>
            <p className="text-muted">
              هيتحذف الكود{' '}
              <span dir="ltr" className="font-bold text-gold-light">
                {deleting.code}
              </span>{' '}
              نهائياً. لو عاوز توقفه بس، اقفل زرار التفعيل.
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
