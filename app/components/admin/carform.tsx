'use client';

import { useEffect, useRef, useState } from 'react';
import { catalogError, catalogImageAccept, isCatalogMoney, newCatalogId, saveCatalogRecord, uploadCatalogImages } from '../../lib/supabase/admin-catalog';

export type CarRow = {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  seats: number | null;
  images: string[];
  price_egp: number;
  price_usd: number;
  active: boolean;
  cost_egp: number | null;
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

export default function CarForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: CarRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;

  const [f, setF] = useState({
    name_ar: initial?.name_ar ?? '',
    name_en: initial?.name_en ?? '',
    brand: initial?.brand ?? '',
    model: initial?.model ?? '',
    year: initial?.year?.toString() ?? '',
    seats: initial?.seats?.toString() ?? '',
    price_egp: initial?.price_egp?.toString() ?? '',
    price_usd: initial?.price_usd?.toString() ?? '',
    cost_egp: initial?.cost_egp?.toString() ?? '',
    description_ar: initial?.description_ar ?? '',
    description_en: initial?.description_en ?? '',
    active: initial?.active ?? true,
  });
  const [images, setImages] = useState<string[]>(initial?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const recordId = useRef(initial?.id);
  const busy = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  // قفل سكرول الصفحة + Esc
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy.current && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose, saving]);

  async function upload(files: FileList | null) {
    if (!files?.length || busy.current) return;
    busy.current = true;
    setError('');
    setUploading(true);
    try {
      setError(await uploadCatalogImages('cars', files, 6 - images.length, (url) => {
        setImages((current) => [...current, url]);
      }));
    } catch (error) {
      setError(catalogError(error));
    } finally {
      busy.current = false;
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const makeCover = (i: number) =>
    setImages((p) => [p[i], ...p.filter((_, idx) => idx !== i)]);
  const removeImage = (i: number) => setImages((p) => p.filter((_, idx) => idx !== i));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy.current) return;
    setError('');

    const priceEgp = Number(f.price_egp);
    const priceUsd = Number(f.price_usd);
    const cost = f.cost_egp.trim() === '' ? null : Number(f.cost_egp);

    if (!f.name_ar.trim() || !f.name_en.trim())
      return setError('اكتب اسم السيارة بالعربي والإنجليزي.');
    if (f.price_egp === '' || f.price_usd === '' || !isCatalogMoney(priceEgp) || !isCatalogMoney(priceUsd))
      return setError('اكتب سعر اليوم بالجنيه وبالدولار.');
    if (cost !== null && !isCatalogMoney(cost))
      return setError('تكلفة اليوم لازم تكون رقم صحيح.');

    const year = f.year === '' ? null : Number(f.year);
    const seats = f.seats === '' ? null : Number(f.seats);
    if ((year !== null && (!Number.isInteger(year) || year < 1990 || year > 2100)) ||
        (seats !== null && (!Number.isInteger(seats) || seats < 1 || seats > 60))) {
      return setError('راجع سنة الصنع وعدد المقاعد.');
    }

    const payload = {
      name_ar: f.name_ar.trim(),
      name_en: f.name_en.trim(),
      description_ar: f.description_ar.trim() || null,
      description_en: f.description_en.trim() || null,
      brand: f.brand.trim() || null,
      model: f.model.trim() || null,
      year,
      seats,
      images,
      price_egp: priceEgp,
      price_usd: priceUsd,
      active: f.active,
    };

    busy.current = true;
    setSaving(true);
    try {
      recordId.current ??= newCatalogId();
      const error = await saveCatalogRecord('cars', recordId.current, isEdit, payload, cost);
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
            {isEdit ? 'تعديل السيارة' : 'إضافة سيارة جديدة'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || uploading}
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
              <Field label="اسم السيارة (عربي) *">
                <input
                  value={f.name_ar}
                  onChange={(e) => set('name_ar', e.target.value)}
                  placeholder="مثال: مرسيدس E-Class"
                  style={{ padding: '0.75rem 1rem' }}
                  className={inputClass}
                />
              </Field>
              <Field label="اسم السيارة (إنجليزي) *">
                <input
                  dir="ltr"
                  value={f.name_en}
                  onChange={(e) => set('name_en', e.target.value)}
                  placeholder="Mercedes E-Class"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="الماركة">
                <input
                  dir="ltr"
                  value={f.brand}
                  onChange={(e) => set('brand', e.target.value)}
                  placeholder="Mercedes"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="الموديل">
                <input
                  dir="ltr"
                  value={f.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder="E-Class"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="سنة الصنع">
                <input
                  type="number"
                  dir="ltr"
                  min={1990}
                  max={2100}
                  value={f.year}
                  onChange={(e) => set('year', e.target.value)}
                  placeholder="2023"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="عدد المقاعد">
                <input
                  type="number"
                  dir="ltr"
                  min={1}
                  max={60}
                  value={f.seats}
                  onChange={(e) => set('seats', e.target.value)}
                  placeholder="4"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
            </div>
          </Section>

          <Section title="الأسعار والتكلفة (لليوم الواحد)">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="السعر بالجنيه *">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  step="0.01"
                  value={f.price_egp}
                  onChange={(e) => set('price_egp', e.target.value)}
                  placeholder="4500"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="السعر بالدولار *">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  step="0.01"
                  value={f.price_usd}
                  onChange={(e) => set('price_usd', e.target.value)}
                  placeholder="95"
                  style={{ padding: '0.75rem 1rem' }}
                  className={`${inputClass} text-start`}
                />
              </Field>
              <Field label="تكلفة اليوم بالجنيه" hint="مخفية عن العملاء، للماليات بس">
                <input
                  type="number"
                  dir="ltr"
                  min={0}
                  step="0.01"
                  value={f.cost_egp}
                  onChange={(e) => set('cost_egp', e.target.value)}
                  placeholder="2500"
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
                الربح المتوقع في اليوم: {money(profit)}
              </p>
            )}
          </Section>

          <Section title="الوصف">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الوصف (عربي)">
                <textarea
                  rows={4}
                  value={f.description_ar}
                  onChange={(e) => set('description_ar', e.target.value)}
                  placeholder="اكتب وصف مختصر للسيارة..."
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
                  placeholder="Short description of the car..."
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

                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-linear-to-t from-black/80 to-transparent opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100" style={{ padding: '0.5rem' }}>
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

              {images.length < 6 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading || saving}
                  className="flex aspect-[4/3] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold/40 text-gold transition hover:border-gold hover:bg-gold/5 disabled:opacity-60"
                >
                  <span className="text-sm font-bold">
                    {uploading ? 'جاري الرفع...' : 'إضافة صور'}
                  </span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept={catalogImageAccept}
              multiple
              hidden
              onChange={(e) => upload(e.target.files)}
            />
            <p className="text-xs text-muted">
              لحد 6 صور، كل صورة أقل من 5 ميجا. أول صورة هي غلاف السيارة في الموقع.
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
              <span className="font-bold text-white">إظهار السيارة في الموقع</span>
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
            disabled={saving || uploading}
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
            {saving ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : 'إضافة السيارة'}
          </button>
        </div>
      </form>
    </div>
  );
}