'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '../../lib/supabase/client';

export type ApartmentRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  location_ar: string | null;
  location_en: string | null;
  bedrooms: number | null;
  max_guests: number | null;
  amenities: string[];
  images: string[];
  price_egp: number;
  price_usd: number;
  active: boolean;
  cost_egp: number | null;
};

// المفاتيح بتتخزن في الداتابيز، والعربي للعرض هنا بس
export const AMENITIES: Record<string, string> = {
  wifi: 'واي فاي',
  ac: 'تكييف',
  kitchen: 'مطبخ مجهز',
  tv: 'تلفزيون',
  washer: 'غسالة',
  parking: 'جراج',
  pool: 'حمام سباحة',
  gym: 'جيم',
  balcony: 'بلكونة',
  elevator: 'أسانسير',
  security: 'أمن 24 ساعة',
  nile: 'إطلالة على النيل',
};

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="flex flex-col gap-4 rounded-2xl border border-line bg-navy/50"
      style={{ padding: '1.25rem' }}
    >
      <h3 className="font-bold text-gold">{title}</h3>
      {children}
    </section>
  );
}

const money = (n: number) =>
  new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(n);

export default function ApartmentForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: ApartmentRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;

  const [f, setF] = useState({
    name_ar: initial?.name_ar ?? '',
    name_en: initial?.name_en ?? '',
    location_ar: initial?.location_ar ?? '',
    location_en: initial?.location_en ?? '',
    bedrooms: initial?.bedrooms?.toString() ?? '',
    max_guests: initial?.max_guests?.toString() ?? '',
    price_egp: initial?.price_egp?.toString() ?? '',
    price_usd: initial?.price_usd?.toString() ?? '',
    cost_egp: initial?.cost_egp?.toString() ?? '',
    description_ar: initial?.description_ar ?? '',
    description_en: initial?.description_en ?? '',
    active: initial?.active ?? true,
  });
  const [amenities, setAmenities] = useState<string[]>(initial?.amenities ?? []);
  const [custom, setCustom] = useState('');
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  // قفل سكرول الصفحة + Esc
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, saving]);

  function readableError(err: { message: string; code?: string }) {
    const m = err.message.toLowerCase();
    if (err.code === '42501' || m.includes('row-level security'))
      return 'الحساب ده ملوش صلاحية التعديل. اتأكد إنه أدمن.';
    if (m.includes('bucket not found')) return 'مخزن الصور (images) مش موجود في Supabase.';
    return err.message;
  }

  const toggleAmenity = (k: string) =>
    setAmenities((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]));

  function addCustom() {
    const v = custom.trim();
    if (!v) return;
    if (!amenities.includes(v)) setAmenities((p) => [...p, v]);
    setCustom('');
  }

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError('');
    setUploading(true);

    const supabase = createClient();
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      if (images.length + urls.length >= 8) {
        setError('أقصى عدد للصور 8 صور.');
        break;
      }
      if (!file.type.startsWith('image/')) {
        setError('الملف لازم يكون صورة.');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('حجم الصورة لازم يكون أقل من 5 ميجا.');
        continue;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `apartments/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('images')
        .upload(path, file, { cacheControl: '31536000', upsert: false });

      if (upErr) {
        setError('فشل رفع الصورة: ' + readableError(upErr as { message: string }));
        continue;
      }
      urls.push(supabase.storage.from('images').getPublicUrl(path).data.publicUrl);
    }

    setImages((p) => [...p, ...urls]);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  const makeCover = (i: number) =>
    setImages((p) => [p[i], ...p.filter((_, idx) => idx !== i)]);
  const removeImage = (i: number) => setImages((p) => p.filter((_, idx) => idx !== i));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const priceEgp = Number(f.price_egp);
    const priceUsd = Number(f.price_usd);
    const cost = f.cost_egp.trim() === '' ? null : Number(f.cost_egp);

    if (!f.name_ar.trim() || !f.name_en.trim())
      return setError('اكتب اسم الشقة بالعربي والإنجليزي.');
    if (f.price_egp === '' || f.price_usd === '' || priceEgp < 0 || priceUsd < 0)
      return setError('اكتب سعر الليلة بالجنيه وبالدولار.');
    if (cost !== null && (Number.isNaN(cost) || cost < 0))
      return setError('تكلفة الليلة لازم تكون رقم صحيح.');

    setSaving(true);
    const supabase = createClient();

    const payload = {
      name_ar: f.name_ar.trim(),
      name_en: f.name_en.trim(),
      description_ar: f.description_ar.trim() || null,
      description_en: f.description_en.trim() || null,
      location_ar: f.location_ar.trim() || null,
      location_en: f.location_en.trim() || null,
      bedrooms: f.bedrooms ? Number(f.bedrooms) : null,
      max_guests: f.max_guests ? Number(f.max_guests) : null,
      amenities,
      images,
      price_egp: priceEgp,
      price_usd: priceUsd,
      active: f.active,
    };

    let aptId = initial?.id;

    if (isEdit) {
      const { error: err } = await supabase.from('apartments').update(payload).eq('id', aptId);
      if (err) {
        setError(readableError(err));
        setSaving(false);
        return;
      }
    } else {
      const { data, error: err } = await supabase
        .from('apartments')
        .insert(payload)
        .select('id')
        .single();
      if (err || !data) {
        setError(readableError(err ?? { message: 'حصل خطأ' }));
        setSaving(false);
        return;
      }
      aptId = data.id;
    }

    if (cost !== null) {
      const { error: costErr } = await supabase
        .from('costs')
        .upsert({ apartment_id: aptId, cost_egp: cost }, { onConflict: 'apartment_id' });
      if (costErr) {
        setError('اتحفظت الشقة، بس التكلفة ما اتحفظتش: ' + readableError(costErr));
        setSaving(false);
        onSaved();
        return;
      }
    }

    onSaved();
  }

  const profit =
    f.price_egp !== '' && f.cost_egp !== '' ? Number(f.price_egp) - Number(f.cost_egp) : null;

  const customAmenities = amenities.filter((a) => !(a in AMENITIES));

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div
        onClick={() => !saving && onClose()}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <form
        onSubmit={onSubmit}
        className="relative flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-navy-light shadow-2xl shadow-black/60 sm:rounded-3xl"
      >
        {/* ----- الهيدر ----- */}
        <div
          className="flex items-center justify-between gap-3 border-b border-line"
          style={{ padding: '1rem 1.25rem' }}
        >
          <h2 className="text-xl font-extrabold text-white">
            {isEdit ? 'تعديل الشقة' : 'إضافة شقة جديدة'}
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

        {/* ----- المحتوى ----- */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto" style={{ padding: '1.25rem' }}>
          <Section title="البيانات الأساسية">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الشقة (عربي) *">
                <input
                  value={f.name_ar}
                  onChange={(e) => set('name_ar', e.target.value)}
                  placeholder="مثال: جناح بإطلالة على النيل"
                  style={{ padding: '0.75rem 1rem' }}
                  className={inputClass}
                />
              </Field>
              <Field label="اسم الشقة (إنجليزي) *">
                <input
                  dir="ltr"
                  value={f.name_en}
                  onChange={(e) => set('name_en', e.target.value)}
                  placeholder="Nile View Suite"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="الموقع (عربي)">
                <input
                  value={f.location_ar}
                  onChange={(e) => set('location_ar', e.target.value)}
                  placeholder="الزمالك، القاهرة"
                  style={{ padding: '0.75rem 1rem' }}
                  className={inputClass}
                />
              </Field>
              <Field label="الموقع (إنجليزي)">
                <input
                  dir="ltr"
                  value={f.location_en}
                  onChange={(e) => set('location_en', e.target.value)}
                  placeholder="Zamalek, Cairo"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="عدد الغرف">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  max={20}
                  value={f.bedrooms}
                  onChange={(e) => set('bedrooms', e.target.value)}
                  placeholder="2"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="أقصى عدد ضيوف">
                <input
                  type="number"
                  dir="ltr"
                  min={1}
                  max={50}
                  value={f.max_guests}
                  onChange={(e) => set('max_guests', e.target.value)}
                  placeholder="4"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
            </div>
          </Section>

          <Section title="الأسعار والتكلفة (لليلة الواحدة)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="السعر بالجنيه *">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  value={f.price_egp}
                  onChange={(e) => set('price_egp', e.target.value)}
                  placeholder="3000"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="السعر بالدولار *">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  value={f.price_usd}
                  onChange={(e) => set('price_usd', e.target.value)}
                  placeholder="65"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="تكلفة الليلة بالجنيه" hint="مخفية عن العملاء، للماليات بس">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  value={f.cost_egp}
                  onChange={(e) => set('cost_egp', e.target.value)}
                  placeholder="1500"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
            </div>

            {profit !== null && !Number.isNaN(profit) && (
              <p
                className={`rounded-xl border text-sm font-bold ${
                  profit >= 0
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-red-500/40 bg-red-500/10 text-red-300'
                }`}
                style={{ padding: '0.7rem 1rem' }}
              >
                الربح المتوقع في الليلة: {money(profit)}
              </p>
            )}
          </Section>

          <Section title="المرافق والخدمات">
            <div className="flex flex-wrap gap-2">
              {Object.entries(AMENITIES).map(([k, label]) => {
                const on = amenities.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleAmenity(k)}
                    style={{ padding: '0.4rem 1rem' }}
                    className={`rounded-full border text-sm font-bold transition ${
                      on
                        ? 'border-gold bg-gold text-navy shadow-md shadow-gold/30'
                        : 'border-line text-muted hover:border-gold hover:text-gold-light'
                    }`}
                  >
                    {on && '✓ '}
                    {label}
                  </button>
                );
              })}

              {customAmenities.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleAmenity(a)}
                  title="اضغط للحذف"
                  style={{ padding: '0.4rem 1rem' }}
                  className="rounded-full border border-gold bg-gold/15 text-sm font-bold text-gold-light transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-300"
                >
                  {a} ✕
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom();
                  }
                }}
                placeholder="مرفق تاني (مثال: شاطئ خاص)"
                style={{ padding: '0.65rem 1rem' }}
                className={inputClass}
              />
              <button
                type="button"
                onClick={addCustom}
                style={{ padding: '0.65rem 1.25rem' }}
                className="shrink-0 rounded-xl border border-gold/50 font-bold text-gold transition hover:bg-gold hover:text-navy"
              >
                إضافة
              </button>
            </div>
          </Section>

          <Section title="الوصف">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الوصف (عربي)">
                <textarea
                  rows={4}
                  value={f.description_ar}
                  onChange={(e) => set('description_ar', e.target.value)}
                  placeholder="اكتب وصف مختصر للشقة..."
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} resize-y`}
                />
              </Field>
              <Field label="الوصف (إنجليزي)">
                <textarea
                  rows={4}
                  dir="ltr"
                  value={f.description_en}
                  onChange={(e) => set('description_en', e.target.value)}
                  placeholder="Short description of the apartment..."
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} resize-y text-start`}
                />
              </Field>
            </div>
          </Section>

          <Section title="الصور">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((url, i) => (
                <div
                  key={url}
                  className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-navy"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />

                  {i === 0 && (
                    <span
                      className="absolute start-2 top-2 rounded-full bg-gold text-xs font-bold text-navy"
                      style={{ padding: '0.15rem 0.6rem' }}
                    >
                      الغلاف
                    </span>
                  )}

                  <div
                    className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-linear-to-t from-black/80 to-transparent opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100"
                    style={{ padding: '0.5rem' }}
                  >
                    {i !== 0 ? (
                      <button
                        type="button"
                        onClick={() => makeCover(i)}
                        className="rounded-lg bg-white/15 text-xs font-bold text-white backdrop-blur hover:bg-gold hover:text-navy"
                        style={{ padding: '0.25rem 0.6rem' }}
                      >
                        اجعلها الغلاف
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="rounded-lg bg-red-500/80 text-xs font-bold text-white hover:bg-red-500"
                      style={{ padding: '0.25rem 0.6rem' }}
                    >
                      حذف
                    </button>
                  </div>
                </div>
              ))}

              {images.length < 8 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/40 text-gold transition hover:border-gold hover:bg-gold/5 disabled:opacity-60"
                >
                  <span className="text-3xl leading-none">{uploading ? '…' : '+'}</span>
                  <span className="text-sm font-bold">
                    {uploading ? 'جاري الرفع...' : 'إضافة صور'}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => upload(e.target.files)}
            />
            <p className="text-xs text-muted">
              لحد 8 صور، كل صورة أقل من 5 ميجا. أول صورة هي غلاف الشقة في الموقع.
            </p>
          </Section>

          <button
            type="button"
            role="switch"
            aria-checked={f.active}
            onClick={() => set('active', !f.active)}
            className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-navy/50 text-start transition hover:border-gold/60"
            style={{ padding: '1rem 1.25rem' }}
          >
            <span className="flex flex-col gap-0.5">
              <span className="font-bold text-white">إظهار الشقة في الموقع</span>
              <span className="text-sm text-muted">
                {f.active ? 'ظاهرة للعملاء ويقدروا يحجزوها' : 'مخفية، مش هتظهر للعملاء'}
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

        {/* ----- الأزرار ----- */}
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
            disabled={saving || uploading}
            style={{ padding: '0.75rem 2rem' }}
            className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة الشقة'}
          </button>
        </div>
      </form>
    </div>
  );
}