'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/lib/supabase/client';

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted/60 transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none disabled:opacity-60';

function strengthScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const STRENGTH = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية'];
const STRENGTH_COLOR = ['', 'bg-red-400', 'bg-amber-400', 'bg-gold-light', 'bg-emerald-400'];

function Section({
  title,
  text,
  children,
}: {
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-navy-light" style={{ padding: '1.5rem' }}>
      <div className="flex items-start gap-3" style={{ marginBlockEnd: '1.25rem' }}>
        <div>
          <h2 className="text-lg font-bold text-white md:text-xl">{title}</h2>
          <p className="text-sm text-muted">{text}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-white/85">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted">{hint}</span>}
    </label>
  );
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        style={{ padding: '0.75rem 1rem' }}
        className={`${inputClass} text-start`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? 'إخفاء' : 'إظهار'}
        className="block text-sm font-semibold text-gold-light hover:underline"
        style={{ marginInlineStart: 'auto', marginBlockStart: '0.4rem' }}
      >
        {show ? 'إخفاء' : 'إظهار'}
      </button>
    </div>
  );
}

function Message({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <p
      role={kind === 'error' ? 'alert' : 'status'}
      className={`rounded-xl border text-center text-sm ${
        kind === 'error'
          ? 'border-red-500/40 bg-red-500/10 text-red-300'
          : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
      }`}
      style={{ padding: '0.7rem 1rem' }}
    >
      {children}
    </p>
  );
}

const SaveButton = ({ busy, label, disabled }: { busy: boolean; label: string; disabled?: boolean }) => (
  <button
    type="submit"
    disabled={busy || disabled}
    style={{ padding: '0.75rem 2rem' }}
    className="w-full rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:w-auto"
  >
    {busy ? 'جاري الحفظ...' : label}
  </button>
);

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');

  /* ---------- حسابي ---------- */
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMsg, setProfileMsg] = useState<null | { kind: 'error' | 'success'; text: string }>(null);

  /* ---------- كلمة المرور ---------- */
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState<null | { kind: 'error' | 'success'; text: string }>(null);

  /* ---------- سعر الصرف ---------- */
  const [rate, setRate] = useState('');
  const [rateUnavailable, setRateUnavailable] = useState('');
  const [rateBusy, setRateBusy] = useState(false);
  const [rateMsg, setRateMsg] = useState<null | { kind: 'error' | 'success'; text: string }>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.getUser();
      const user = data.user;
      if (!alive) return;
      if (!user) {
        const message = authError?.message ?? 'تعذّر التحقق من الحساب.';
        setProfileMsg({ kind: 'error', text: message });
        setRateUnavailable(message);
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? '');

      const [profile, setting] = await Promise.all([
        supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
        supabase.from('settings').select('value').eq('key', 'usd_egp_rate').single(),
      ]);

      if (!alive) return;

      setName(profile.data?.full_name ?? '');
      setPhone(profile.data?.phone ?? '');
      if (profile.error) setProfileMsg({ kind: 'error', text: profile.error.message });

      if (setting.error || typeof setting.data?.value !== 'number') {
        setRateUnavailable(setting.error?.message ?? 'سعر الصرف المخزّن غير صالح.');
      } else {
        setRate(String(setting.data.value));
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);

    if (name.trim().length < 2) return setProfileMsg({ kind: 'error', text: 'اكتب الاسم.' });

    setProfileBusy(true);
    const { error } = await createClient()
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', userId)
      .select('id')
      .single();
    setProfileBusy(false);

    setProfileMsg(
      error
        ? { kind: 'error', text: 'فشل الحفظ: ' + error.message }
        : { kind: 'success', text: 'تم حفظ بياناتك' }
    );
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (next.length < 8)
      return setPwMsg({ kind: 'error', text: 'كلمة المرور الجديدة لازم تكون 8 حروف على الأقل.' });
    if (next !== confirm) return setPwMsg({ kind: 'error', text: 'كلمتا المرور الجديدتان غير متطابقتين.' });
    if (next === current)
      return setPwMsg({ kind: 'error', text: 'كلمة المرور الجديدة لازم تكون مختلفة عن الحالية.' });

    setPwBusy(true);
    const supabase = createClient();

    // نتأكد من كلمة المرور الحالية الأول
    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setPwBusy(false);
      return setPwMsg({ kind: 'error', text: 'كلمة المرور الحالية غير صحيحة.' });
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setPwBusy(false);

    if (error) {
      return setPwMsg({ kind: 'error', text: 'فشل التغيير: ' + error.message });
    }

    setCurrent('');
    setNext('');
    setConfirm('');
    setPwMsg({ kind: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
  }

  async function saveRate(e: React.FormEvent) {
    e.preventDefault();
    setRateMsg(null);

    const value = Number(rate);
    if (!rate || Number.isNaN(value) || value <= 0 || value > 1000)
      return setRateMsg({ kind: 'error', text: 'اكتب سعر صرف صحيح (رقم أكبر من صفر).' });

    setRateBusy(true);
    const { error } = await createClient()
      .from('settings')
      .upsert({ key: 'usd_egp_rate', value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
      .select('key')
      .single();
    setRateBusy(false);

    setRateMsg(
      error
        ? {
            kind: 'error',
            text:
              error.code === '42501'
                ? 'الحساب ده ملوش صلاحية التعديل.'
                : 'فشل الحفظ: ' + error.message,
          }
        : { kind: 'success', text: 'تم حفظ سعر الصرف وهيتطبق على الحجوزات الجديدة.' }
    );
  }

  const score = strengthScore(next);
  const rateNum = Number(rate);
  const egp = (n: number) =>
    new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 2 }).format(n);

  if (loading) {
    return (
      <div className="flex flex-col gap-5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-3xl border border-line bg-navy-light" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white md:text-3xl">الإعدادات</h1>
        <p className="text-muted" style={{ marginBlockStart: '0.25rem' }}>
          بيانات حسابك، كلمة المرور، وسعر الصرف.
        </p>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* ================= حسابي ================= */}
        <Section title="حسابي" text="بياناتك الشخصية كمدير للموقع.">
          <form onSubmit={saveProfile} className="flex flex-col gap-4">
            <Field label="الإيميل" hint="الإيميل ما يتغيرش من هنا.">
              <input dir="ltr" value={email} disabled style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الاسم">
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.75rem 1rem' }} className={inputClass} />
              </Field>
              <Field label="رقم التليفون">
                <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 10 0000 0000" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
            </div>

            {profileMsg && <Message kind={profileMsg.kind}>{profileMsg.text}</Message>}
            <SaveButton busy={profileBusy} label="حفظ البيانات" />
          </form>
        </Section>

        {/* ================= كلمة المرور ================= */}
        <Section title="تغيير كلمة المرور" text="اكتب كلمة مرورك الحالية الأول، وبعدها الجديدة.">
          <form onSubmit={changePassword} className="flex flex-col gap-4">
            <Field label="كلمة المرور الحالية">
              <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
            </Field>

            <Field label="كلمة المرور الجديدة">
              <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
            </Field>

            {next && (
              <div className="flex items-center gap-3">
                <div className="grid flex-1 grid-cols-4 gap-1">
                  {[1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className={`h-1 rounded-full transition-colors duration-300 ${score >= n ? STRENGTH_COLOR[score] : 'bg-line'}`}
                    />
                  ))}
                </div>
                <span className="min-w-14 text-end text-xs text-muted">{STRENGTH[score]}</span>
              </div>
            )}

            <Field label="تأكيد كلمة المرور الجديدة">
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </Field>

            {confirm && next !== confirm && (
              <p className="text-sm text-red-300">كلمتا المرور مش متطابقتين.</p>
            )}

            {pwMsg && <Message kind={pwMsg.kind}>{pwMsg.text}</Message>}
            <SaveButton busy={pwBusy} label="تغيير كلمة المرور" disabled={!current || !next || !confirm} />
          </form>
        </Section>

        {/* ================= سعر الصرف ================= */}
        <Section title="سعر الصرف" text="سعر الدولار بالجنيه، بيتحسب بيه حجوزات العملاء اللي بيدفعوا بالدولار.">
          {rateUnavailable ? (
            <Message kind="error">{rateUnavailable}</Message>
          ) : (
            <form onSubmit={saveRate} className="flex flex-col gap-4">
              <Field label="1 دولار = كام جنيه؟">
                <div className="relative">
                  <input
                    type="number"
                    dir="ltr"
                    step="0.01"
                    min="0"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    placeholder="50"
                    style={{ padding: '0.75rem 1rem' }}
                    className={`${inputClass} text-start text-lg font-bold`}
                  />
                  <span className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gold">
                    ج.م
                  </span>
                </div>
              </Field>

              {rateNum > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  {[1, 10, 100].map((n) => (
                    <div key={n} className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.4rem' }}>
                      <p dir="ltr" className="text-xs text-muted">
                        ${n}
                      </p>
                      <p className="font-bold text-gold-light">{egp(n * rateNum)}</p>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs leading-6 text-muted">
                التغيير بيطبّق على الحجوزات الجديدة بس، والحجوزات القديمة بتفضل بالسعر اللي اتحجزت بيه.
              </p>

              {rateMsg && <Message kind={rateMsg.kind}>{rateMsg.text}</Message>}
              <SaveButton busy={rateBusy} label="حفظ سعر الصرف" />
            </form>
          )}
        </Section>
      </div>
    </div>
  );
}
