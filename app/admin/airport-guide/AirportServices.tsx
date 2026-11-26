'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { catalogError, isCatalogMoney, newCatalogId, saveCatalogRecord } from '@/app/lib/supabase/admin-catalog';

type Service = {
  id: string;
  icon: string;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  features_ar: string | null;
  features_en: string | null;
  price_egp: number;
  price_usd: number;
  sort_order: number;
  active: boolean;
  featured: boolean;
  cost_egp: number | null;
};

type ServiceRow = Omit<Service, 'cost_egp'> & {
  costs: { cost_egp: number } | { cost_egp: number }[] | null;
};

const button = 'rounded-xl bg-gold font-bold text-navy disabled:opacity-50';
const buttonStyle = { padding: '0.5rem 1rem' };
const input = 'w-full rounded-xl border border-line bg-navy text-white';
const inputStyle = { padding: '0.5rem 0.75rem' };
const textFields = [
  ['name_ar', 'الاسم بالعربية'],
  ['name_en', 'الاسم بالإنجليزية'],
  ['description_ar', 'الوصف بالعربية'],
  ['description_en', 'الوصف بالإنجليزية'],
  ['features_ar', 'المزايا بالعربية'],
  ['features_en', 'المزايا بالإنجليزية'],
] as const;
const numberFields = [
  ['price_egp', 'السعر بالجنيه'],
  ['price_usd', 'السعر بالدولار'],
  ['cost_egp', 'التكلفة بالجنيه'],
  ['sort_order', 'ترتيب العرض'],
] as const;

function ServiceForm({ service, onSaved, onCancel }: {
  service: Service | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [id] = useState(() => service?.id ?? newCatalogId());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const element = event.currentTarget;
    const form = new FormData(element);
    const value = (name: string) => String(form.get(name) ?? '').trim();
    const invalidNumber = (name: string) => {
      const { validity } = element.elements.namedItem(name) as HTMLInputElement;
      return validity.badInput || validity.stepMismatch;
    };
    const price_egp = Number(value('price_egp'));
    const price_usd = Number(value('price_usd'));
    const cost = value('cost_egp') === '' ? null : Number(value('cost_egp'));
    const sort_order = Number(value('sort_order'));
    const name_ar = value('name_ar');
    const name_en = value('name_en');
    if (!name_ar || !name_en) return setError('اكتب اسم الخدمة بالعربية والإنجليزية.');
    if (!value('price_egp') || !value('price_usd') || !isCatalogMoney(price_egp) || !isCatalogMoney(price_usd) ||
        invalidNumber('price_egp') || invalidNumber('price_usd'))
      return setError('أدخل سعرًا صالحًا بالجنيه والدولار. يمكن أن يكون السعر صفرًا.');
    if (invalidNumber('cost_egp') || (cost !== null && !isCatalogMoney(cost)))
      return setError('أدخل تكلفة صالحة بالجنيه أو اتركها فارغة.');
    if (!value('sort_order') || !Number.isInteger(sort_order) || sort_order < 0 || sort_order > 2147483647)
      return setError('أدخل عددًا صحيحًا غير سالب لترتيب العرض.');

    setBusy(true);
    setError('');
    try {
      const message = await saveCatalogRecord('airport_services', id, Boolean(service), {
        icon: value('icon'),
        name_ar, name_en, price_egp, price_usd, sort_order,
        description_ar: value('description_ar') || null,
        description_en: value('description_en') || null,
        features_ar: value('features_ar') || null,
        features_en: value('features_en') || null,
        active: form.has('active'),
        featured: form.has('featured'),
      }, cost);
      if (message) setError(message);
      else onSaved();
    } catch (error) {
      setError(catalogError(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 rounded-2xl border border-line bg-navy-light" style={{ padding: '1.25rem' }}>
      <h2 className="text-xl font-bold text-gold">{service ? 'تعديل الخدمة' : 'إضافة خدمة'}</h2>
      <fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2">
        {textFields.map(([name, label]) => (
          <label className="grid gap-1" key={name}>
            {label}
            {name.startsWith('name_')
              ? <input className={input} style={inputStyle} dir={name.endsWith('_en') ? 'ltr' : 'rtl'} name={name} defaultValue={service?.[name] ?? ''} required />
              : <textarea className={input} style={inputStyle} dir={name.endsWith('_en') ? 'ltr' : 'rtl'} name={name}
                  placeholder={name.startsWith('features_') ? (name.endsWith('_en') ? 'One feature per line' : 'ميزة واحدة في كل سطر') : undefined}
                  defaultValue={service?.[name] ?? ''} rows={3} />}
          </label>
        ))}
        {numberFields.map(([name, label]) => (
          <label className="grid gap-1" key={name}>
            {label}
            <input className={input} style={inputStyle} dir="ltr" name={name} type="number" min={0} step={name === 'sort_order' ? 1 : 0.01}
              required={name !== 'cost_egp'} defaultValue={service?.[name] ?? (name === 'sort_order' ? 0 : '')} />
          </label>
        ))}
        <label className="grid gap-1">الأيقونة (اختياري)<input className={input} style={inputStyle} name="icon" defaultValue={service?.icon ?? ''} /></label>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex gap-2"><input type="checkbox" name="active" defaultChecked={service?.active ?? true} /> ظاهرة</label>
          <label className="flex gap-2"><input type="checkbox" name="featured" defaultChecked={service?.featured ?? false} /> مميزة</label>
        </div>
      </fieldset>
      {error && <p role="alert" className="text-red-300">{error}</p>}
      <div className="flex gap-3">
        <button className={button} style={buttonStyle} disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ'}</button>
        <button type="button" className="rounded-xl border border-line" style={buttonStyle} onClick={onCancel} disabled={busy}>إلغاء</button>
      </div>
    </form>
  );
}

export default function AirportServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<Service>();
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [toggleId, setToggleId] = useState<string>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    void createClient().from('airport_services')
      .select('id,icon,name_ar,name_en,description_ar,description_en,features_ar,features_en,price_egp,price_usd,sort_order,active,featured,costs(cost_egp)')
      .order('sort_order').order('name_ar').order('id').returns<ServiceRow[]>()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setServices((data ?? []).map(({ costs, ...service }) => {
          const cost = Array.isArray(costs) ? costs[0] : costs;
          return { ...service, cost_egp: cost?.cost_egp == null ? null : Number(cost.cost_egp) };
        }));
        setLoading(false);
      }, (error: unknown) => {
        if (!active) return;
        setError(catalogError(error));
        setLoading(false);
      });
    return () => { active = false; };
  }, [revision]);

  function reload() {
    setLoading(true);
    setError('');
    setRevision((value) => value + 1);
  }

  async function remove() {
    if (!deleting || deleteBusy) return;
    setDeleteBusy(true);
    setError('');
    try {
      const { error } = await createClient().from('airport_services').delete().eq('id', deleting.id).select('id').single();
      if (error) {
        if (['23503', '23001'].includes(error.code)) {
          setDeleting(undefined);
          setError('الخدمة مرتبطة بحجز. أخفِها من الموقع للاحتفاظ بسجل الحجز.');
        } else {
          setError(error.message);
        }
        return;
      }
      setDeleting(undefined);
      reload();
    } catch (error) {
      setError(catalogError(error));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggle(service: Service) {
    if (toggleId) return;
    setToggleId(service.id);
    setError('');
    try {
      const { data, error } = await createClient().from('airport_services')
        .update({ active: !service.active, updated_at: new Date().toISOString() })
        .eq('id', service.id).select('active').single();
      if (error) throw error;
      setServices((items) => items.map((item) => item.id === service.id ? { ...item, active: data.active } : item));
    } catch (error) {
      setError(catalogError(error));
    } finally {
      setToggleId(undefined);
    }
  }

  const actionsDisabled = editing !== undefined || Boolean(deleting) || Boolean(toggleId);

  return (
    <section dir="rtl" aria-labelledby="airport-services-title" className="flex flex-col gap-5 border-b border-line" style={{ paddingBlockEnd: '1.5rem' }}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 id="airport-services-title" className="text-3xl font-extrabold">خدمات المطار</h1>
        <button type="button" className={button} style={buttonStyle} onClick={() => setEditing(null)} disabled={actionsDisabled}>إضافة خدمة</button>
      </div>
      {editing !== undefined && <ServiceForm key={editing?.id ?? 'new'} service={editing} onCancel={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />}
      {error && <p role="alert" className="text-red-300">{error}</p>}
      {deleting && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line" style={{ padding: '1rem' }}>
          <p>هل تريد حذف خدمة {deleting.name_ar}؟</p>
          <button type="button" onClick={remove} className={button} style={buttonStyle} disabled={deleteBusy}>تأكيد الحذف</button>
          <button type="button" onClick={() => setDeleting(undefined)} disabled={deleteBusy}>إلغاء</button>
        </div>
      )}
      {loading ? <p className="text-muted">جارٍ التحميل…</p> : services.length === 0 && !error ? <p className="text-muted">لا توجد خدمات.</p> : (
        <ul className="flex flex-col gap-3">
          {services.map((service) => (
            <li key={service.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-navy-light" style={{ padding: '1rem' }}>
              <div>
                <h2 className="font-bold">{service.icon?.trim() && <span aria-hidden="true">{service.icon} </span>}{service.name_ar}</h2>
                <p className="text-sm text-muted">{service.active ? 'ظاهرة' : 'مخفية'} · {service.price_egp} ج.م. · {service.price_usd} USD</p>
                <p className="text-sm text-muted">ترتيب العرض {service.sort_order} · التكلفة {service.cost_egp === null ? '—' : `${service.cost_egp} ج.م.`}</p>
              </div>
              <div className="flex gap-4">
                <button type="button" className="font-bold text-gold-light disabled:opacity-50" disabled={actionsDisabled}
                  onClick={() => void toggle(service)}>{toggleId === service.id ? 'جارٍ التحديث…' : service.active ? 'إخفاء' : 'إظهار'}</button>
                <button type="button" className="font-bold text-gold disabled:opacity-50" disabled={actionsDisabled} onClick={() => setEditing(service)}>تعديل</button>
                <button type="button" className="font-bold text-red-300 disabled:opacity-50" disabled={actionsDisabled} onClick={() => setDeleting(service)}>حذف</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
