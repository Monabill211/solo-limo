'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { createClient } from '@/app/lib/supabase/client';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Kind = 'car' | 'apartment' | 'airport';
type Status = 'pending' | 'paid' | 'cancelled';
type Tab = 'bookings' | 'profile' | 'security';

type Profile = { full_name: string | null; phone: string | null; customer_code: string; created_at: string };

type BookingExtra = { id: string; name_ar: string | null; name_en: string | null; quantity: number };

type Booking = {
  id: string;
  booking_type: Kind;
  start_date: string;
  end_date: string;
  days: number;
  currency: 'EGP' | 'USD';
  total: number;
  total_egp: number;
  status: Status;
  created_at: string;
  flight_number: string | null;
  service_time: string | null;
  passengers: number | null;
  name_ar: string;
  name_en: string;
  extras: BookingExtra[];
};

type BookingRow = Omit<Booking, 'name_ar' | 'name_en' | 'extras'> & {
  item_name_ar: string | null;
  item_name_en: string | null;
  booking_extras: BookingExtra[];
};

type Code = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
};

const STATUS_STYLE: Record<Status, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  pending: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
  cancelled: 'border-red-500/40 bg-red-500/10 text-red-300',
};

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted/60 transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none disabled:opacity-60';

const ref = (id: string) => id.slice(0, 8).toUpperCase();

function Msg({ kind, children }: { kind: 'error' | 'success'; children: React.ReactNode }) {
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
  const t = useTranslations('Auth');
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
        className="block text-sm font-semibold text-gold-light hover:underline"
        style={{ marginInlineStart: 'auto', marginBlockStart: '0.4rem' }}
      >
        {show ? t('hidePassword') : t('showPassword')}
      </button>
    </div>
  );
}

export default function AccountPage() {
  const t = useTranslations('Account');
  const locale = useLocale();
  const isAr = locale === 'ar';
  const loc = isAr ? 'ar-EG' : 'en-US';
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [userId, setUserId] = useState('');
  const [email, setEmail] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [codes, setCodes] = useState<Code[]>([]);
  const [tab, setTab] = useState<Tab>('bookings');
  const [copied, setCopied] = useState('');

  /* ---------- بياناتي ---------- */
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

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
    const user = data.user;

    if (!user) {
      router.replace('/login');
      return;
    }

    setUserId(user.id);
    setEmail(user.email ?? '');

    const [p, b, c] = await Promise.all([
      supabase.from('profiles').select('full_name, phone, customer_code, created_at').eq('id', user.id).maybeSingle(),
      supabase
        .from('bookings')
        .select('id, booking_type, start_date, end_date, days, currency, total, total_egp, status, created_at, flight_number, service_time, passengers, item_name_ar, item_name_en, booking_extras(id, name_ar, name_en, quantity)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .returns<BookingRow[]>(),
      supabase.from('discount_codes').select('id, code, type, value, expires_at, max_uses, used_count, active')
        .eq('customer_id', user.id).order('created_at', { ascending: false }).returns<Code[]>(),
    ]);

    if (p.error || b.error || c.error) {
      setFailed(true);
      setLoading(false);
      return;
    }

    setProfile(p.data as Profile | null);
    setName(p.data?.full_name ?? '');
    setPhone(p.data?.phone ?? '');

    setBookings(
      (b.data ?? []).map((x) => ({
          id: x.id,
          booking_type: x.booking_type,
          start_date: x.start_date,
          end_date: x.end_date,
          days: Number(x.days),
          currency: x.currency,
          total: Number(x.total),
          total_egp: Number(x.total_egp),
          status: x.status,
          created_at: x.created_at,
          flight_number: x.flight_number ?? null,
          service_time: x.service_time ?? null,
          passengers: x.passengers ?? null,
          name_ar: x.item_name_ar ?? '—',
          name_en: x.item_name_en ?? '—',
          extras: x.booking_extras,
      }))
    );

    setCodes((c.data ?? []).map((x) => ({ ...x, value: Number(x.value) })));
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));

  const money = (n: number, c: 'EGP' | 'USD') =>
    new Intl.NumberFormat(loc, { style: 'currency', currency: c, maximumFractionDigits: 2, minimumFractionDigits: 0 }).format(n);

  const stats = useMemo(() => {
    const paid = bookings.filter((b) => b.status === 'paid');
    return {
      count: bookings.length,
      paid: paid.length,
      spent: paid.reduce((s, b) => s + b.total_egp, 0),
    };
  }, [bookings]);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch {}
  }

  async function logout() {
    await createClient().auth.signOut();
    router.replace('/');
    router.refresh();
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    if (name.trim().length < 2) return setProfileMsg({ kind: 'error', text: t('nameError') });

    setProfileBusy(true);
    const { error } = await createClient()
      .from('profiles')
      .update({ full_name: name.trim(), phone: phone.trim() || null })
      .eq('id', userId)
      .select('id')
      .single();
    setProfileBusy(false);

    setProfileMsg(error ? { kind: 'error', text: error.message } : { kind: 'success', text: t('saved') });
    if (!error) router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);

    if (next.length < 8) return setPwMsg({ kind: 'error', text: t('pwShort') });
    if (next !== confirm) return setPwMsg({ kind: 'error', text: t('pwMismatch') });
    if (next === current) return setPwMsg({ kind: 'error', text: t('pwSame') });

    setPwBusy(true);
    const supabase = createClient();

    const check = await supabase.auth.signInWithPassword({ email, password: current });
    if (check.error) {
      setPwBusy(false);
      return setPwMsg({ kind: 'error', text: t('pwWrong') });
    }

    const { error } = await supabase.auth.updateUser({ password: next });
    setPwBusy(false);

    if (error) return setPwMsg({ kind: 'error', text: t('genericError') });

    setCurrent('');
    setNext('');
    setConfirm('');
    setPwMsg({ kind: 'success', text: t('pwChanged') });
  }

  const codeStatus = (c: Code): 'active' | 'expired' | 'usedUp' | 'inactive' => {
    if (!c.active) return 'inactive';
    if (c.expires_at && new Date(c.expires_at) < new Date()) return 'expired';
    if (c.max_uses !== null && c.used_count >= c.max_uses) return 'usedUp';
    return 'active';
  };

  const waCode = `${WHATSAPP_URL}?text=${encodeURIComponent(`${t('codeWa')} ${profile?.customer_code ?? ''}`)}`;

  /* ---------- حالات التحميل والخطأ ---------- */
  if (loading) {
    return (
      <div className="w-full max-w-5xl" style={{ marginInline: 'auto', padding: '3rem 1rem' }}>
        <div className="flex flex-col gap-5">
          <div className="h-44 animate-pulse rounded-3xl border border-line bg-navy-light" />
          <div className="h-64 animate-pulse rounded-3xl border border-line bg-navy-light" />
        </div>
      </div>
    );
  }

  if (failed || !profile) {
    return (
      <div className="text-center" style={{ padding: '5rem 1rem' }}>
        <p className="text-xl font-bold text-red-300" style={{ marginBlockEnd: '1rem' }}>
          {t('errorLoad')}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{ padding: '0.6rem 1.6rem' }}
          className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy"
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  const firstName = (profile.full_name || email.split('@')[0] || '').split(' ')[0];

  return (
    <div className="w-full max-w-5xl" style={{ marginInline: 'auto', padding: '2.5rem 1rem 4rem' }}>
      {/* ---------- الكارت الرئيسي ---------- */}
      <section
        className="relative overflow-hidden rounded-3xl border border-gold/40 bg-linear-to-br from-navy-light to-navy shadow-2xl shadow-black/40"
        style={{ padding: '1.75rem' }}
      >
        <span className="pointer-events-none absolute -top-20 -end-16 h-60 w-60 rounded-full bg-gold/15 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light text-2xl font-extrabold text-navy">
              {firstName.charAt(0).toUpperCase() || '؟'}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-extrabold text-white md:text-3xl">{t('hello', { name: firstName })}</h1>
              <p dir="ltr" className="truncate text-start text-sm text-muted">
                {email}
              </p>
              <p className="text-xs text-muted">{t('memberSince', { date: fmtDate(profile.created_at) })}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            style={{ padding: '0.55rem 1.3rem' }}
            className="rounded-xl border border-line text-sm font-bold text-muted transition hover:border-red-400 hover:text-red-300"
          >
            {t('logout')}
          </button>
        </div>

        <div className="relative grid grid-cols-3 gap-3" style={{ marginBlockStart: '1.5rem' }}>
          {[
            [t('statBookings'), String(stats.count)],
            [t('statPaid'), String(stats.paid)],
            [t('statSpent'), money(stats.spent, 'EGP')],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-navy/70 text-center" style={{ padding: '0.8rem 0.5rem' }}>
              <p className="text-xs text-muted">{label}</p>
              <p className="truncate font-extrabold text-gold-light md:text-lg" style={{ marginBlockStart: '0.2rem' }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- كود العميل ---------- */}
      <section
        className="grid items-center gap-5 rounded-3xl border border-line bg-navy-light md:grid-cols-[1fr_auto]"
        style={{ padding: '1.5rem', marginBlockStart: '1.5rem' }}
      >
        <div>
          <p className="text-sm text-muted">{t('customerCode')}</p>
          <button
            type="button"
            onClick={() => copy(profile.customer_code)}
            title={t('copy')}
            dir="ltr"
            className="mt-1 inline-flex items-center gap-3 rounded-xl border-2 border-dashed border-gold/60 text-2xl font-extrabold tracking-widest text-gold-light transition hover:bg-gold/10"
            style={{ padding: '0.5rem 1.2rem' }}
          >
            {profile.customer_code}
            <span className="text-xs font-bold tracking-normal text-muted">
              {copied === profile.customer_code ? t('copied') : t('copy')}
            </span>
          </button>
          <p className="max-w-xl leading-8 text-muted" style={{ marginBlockStart: '0.9rem' }}>
            <span className="font-bold text-white">{t('codeTitle')}. </span>
            {t('codeText')}
          </p>
        </div>

        <a
          href={waCode}
          target="_blank"
          rel="noreferrer"
          style={{ padding: '0.85rem 1.8rem' }}
          className="rounded-xl bg-[#25d366] text-center font-bold text-white transition hover:-translate-y-0.5 hover:brightness-110"
        >
          {t('codeButton')}
        </a>
      </section>

      {/* ---------- التابات ---------- */}
      <div
        role="tablist"
        className="relative grid grid-cols-3 rounded-full border border-line bg-navy-light"
        style={{ padding: '0.3rem', marginBlock: '1.75rem' }}
      >
        <span
          className="absolute inset-y-[0.3rem] rounded-full bg-linear-to-br from-gold to-gold-light shadow-lg shadow-gold/40 transition-[inset-inline-start] duration-500 ease-[cubic-bezier(0.6,-0.2,0.3,1.3)]"
          style={{
            width: 'calc((100% - 0.6rem) / 3)',
            insetInlineStart: `calc(0.3rem + ${['bookings', 'profile', 'security'].indexOf(tab)} * (100% - 0.6rem) / 3)`,
          }}
        />
        {(['bookings', 'profile', 'security'] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            style={{ padding: '0.65rem 0.5rem' }}
            className={`relative z-10 truncate text-sm font-bold transition-colors duration-300 sm:text-base ${
              tab === k ? 'text-navy' : 'text-muted hover:text-white'
            }`}
          >
            {t(`tab_${k}`)}
          </button>
        ))}
      </div>

      <div key={tab} className="animate-[fadeIn_0.4s_ease-out]">
        {/* ================= الحجوزات + الأكواد ================= */}
        {tab === 'bookings' && (
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-xl font-bold text-gold" style={{ marginBlockEnd: '1rem' }}>
                {t('myBookings')}
              </h2>

              {bookings.length === 0 ? (
                <div
                  className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-navy-light text-center"
                  style={{ padding: '3rem 1.5rem' }}
                >
                  <p className="text-xl font-bold text-white">{t('noBookingsTitle')}</p>
                  <p className="text-muted">{t('noBookingsText')}</p>
                  <div className="flex flex-wrap justify-center gap-3" style={{ marginBlockStart: '0.5rem' }}>
                    <Link href="/cars" style={{ padding: '0.6rem 1.5rem' }} className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy">
                      {t('browseCars')}
                    </Link>
                    <Link href="/apartments" style={{ padding: '0.6rem 1.5rem' }} className="rounded-xl border border-gold font-bold text-gold transition hover:bg-gold hover:text-navy">
                      {t('browseApartments')}
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {bookings.map((b) => {
                    const name = isAr ? b.name_ar : b.name_en;
                    return (
                      <article
                        key={b.id}
                        className="rounded-3xl border border-line bg-navy-light transition hover:border-gold/60"
                        style={{ padding: '1.25rem' }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-lg font-bold text-white">{name}</p>
                              <p className="text-xs text-muted">
                                {t(`kind_${b.booking_type}`)} ·{' '}
                                <span dir="ltr">
                                  {t('ref')} {ref(b.id)}
                                </span>
                              </p>
                            </div>
                          </div>

                          <span
                            className={`rounded-full border text-xs font-bold ${STATUS_STYLE[b.status]}`}
                            style={{ padding: '0.25rem 0.85rem' }}
                          >
                            {t(`status_${b.status}`)}
                          </span>
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3" style={{ marginBlock: '1rem' }}>
                          {b.booking_type === 'airport' ? (
                            <>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{t('date')}</p>
                                <p className="font-bold text-white">{fmtDate(b.start_date)}</p>
                              </div>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{t('time')}</p>
                                <p dir="ltr" className="text-start font-bold text-white">
                                  {b.service_time?.slice(0, 5) ?? '—'}
                                </p>
                              </div>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{t('flight')}</p>
                                <p dir="ltr" className="text-start font-bold text-white">
                                  {b.flight_number ?? '—'}
                                </p>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{b.booking_type === 'car' ? t('pickup') : t('checkin')}</p>
                                <p className="font-bold text-white">{fmtDate(b.start_date)}</p>
                              </div>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{b.booking_type === 'car' ? t('return') : t('checkout')}</p>
                                <p className="font-bold text-white">{fmtDate(b.end_date)}</p>
                              </div>
                              <div className="rounded-xl bg-navy" style={{ padding: '0.6rem 0.85rem' }}>
                                <p className="text-xs text-muted">{t('duration')}</p>
                                <p className="font-bold text-white">
                                  {b.booking_type === 'car' ? t('days', { n: b.days }) : t('nights', { n: b.days })}
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs text-muted">{t('total')}</p>
                            <p className="text-xl font-extrabold text-gold-light">{money(b.total, b.currency)}</p>
                          </div>

                          {b.status === 'pending' && (
                            <a
                              href={`${WHATSAPP_URL}?text=${encodeURIComponent(`${t('payWa')} ${ref(b.id)}`)}`}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '0.6rem 1.5rem' }}
                              className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:shadow-lg hover:shadow-gold/40"
                            >
                              {t('payNow')}
                            </a>
                          )}
                        </div>

                        <p className="text-xs text-muted" style={{ marginBlockStart: '0.8rem' }}>
                          {t('created')} {fmtDate(b.created_at)}
                        </p>
                        {b.extras.length > 0 && (
                          <div className="mt-3 border-t border-line pt-3 text-sm">
                            <p className="mb-1 font-bold text-gold">{t('bookingExtras')}</p>
                            <ul className="space-y-1 text-muted">
                              {b.extras.map((extra) => (
                                <li key={extra.id}>
                                  {(isAr ? extra.name_ar : extra.name_en) ?? extra.name_ar ?? extra.name_en ?? '—'}
                                  {' × '}{new Intl.NumberFormat(loc).format(extra.quantity)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-bold text-gold" style={{ marginBlockEnd: '1rem' }}>
                {t('myDiscounts')}
              </h2>

              {codes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-line bg-navy-light text-muted" style={{ padding: '1.25rem' }}>
                  {t('noDiscounts')}
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {codes.map((c) => {
                    const st = codeStatus(c);
                    const good = st === 'active';
                    return (
                      <div
                        key={c.id}
                        className={`rounded-2xl border bg-navy-light ${good ? 'border-gold/50' : 'border-line opacity-70'}`}
                        style={{ padding: '1.1rem' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-3xl font-extrabold text-white">
                            {c.type === 'percent' ? `${c.value}%` : money(c.value, 'EGP')}
                            <span className="text-sm font-normal text-muted"> {t('off')}</span>
                          </p>
                          <span
                            className={`rounded-full border text-xs font-bold ${
                              good ? STATUS_STYLE.paid : 'border-line bg-white/5 text-muted'
                            }`}
                            style={{ padding: '0.2rem 0.75rem' }}
                          >
                            {t(`code_${st}`)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => copy(c.code)}
                          dir="ltr"
                          title={t('copy')}
                          className="mt-3 flex w-full items-center justify-between rounded-lg border-2 border-dashed border-gold/50 font-extrabold tracking-widest text-gold-light transition hover:bg-gold/10"
                          style={{ padding: '0.45rem 0.9rem' }}
                        >
                          {c.code}
                          <span className="text-xs font-bold tracking-normal text-muted">
                            {copied === c.code ? t('copied') : t('copy')}
                          </span>
                        </button>

                        <p className="text-xs text-muted" style={{ marginBlockStart: '0.6rem' }}>
                          {c.expires_at ? t('expires', { date: fmtDate(c.expires_at) }) : t('noExpiry')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= بياناتي ================= */}
        {tab === 'profile' && (
          <form
            onSubmit={saveProfile}
            className="flex max-w-2xl flex-col gap-4 rounded-3xl border border-line bg-navy-light"
            style={{ padding: '1.5rem' }}
          >
            <Field label={t('email')} hint={t('emailHint')}>
              <input dir="ltr" value={email} disabled style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t('name')}>
                <input value={name} onChange={(e) => setName(e.target.value)} style={{ padding: '0.75rem 1rem' }} className={inputClass} />
              </Field>
              <Field label={t('phone')}>
                <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 10 0000 0000" style={{ padding: '0.75rem 1rem' }} className={`${inputClass} text-start`} />
              </Field>
            </div>

            {profileMsg && <Msg kind={profileMsg.kind}>{profileMsg.text}</Msg>}

            <button
              type="submit"
              disabled={profileBusy}
              style={{ padding: '0.8rem 2rem' }}
              className="w-full rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 disabled:opacity-60 sm:w-auto sm:self-start"
            >
              {profileBusy ? t('saving') : t('save')}
            </button>
          </form>
        )}

        {/* ================= الأمان ================= */}
        {tab === 'security' && (
          <form
            onSubmit={changePassword}
            className="flex max-w-2xl flex-col gap-4 rounded-3xl border border-line bg-navy-light"
            style={{ padding: '1.5rem' }}
          >
            <div>
              <h2 className="text-lg font-bold text-white">{t('changePassword')}</h2>
              <p className="text-sm text-muted">{t('changePasswordText')}</p>
            </div>

            <Field label={t('currentPassword')}>
              <PasswordInput value={current} onChange={setCurrent} autoComplete="current-password" />
            </Field>
            <Field label={t('newPassword')} hint={t('passwordHint')}>
              <PasswordInput value={next} onChange={setNext} autoComplete="new-password" />
            </Field>
            <Field label={t('confirmPassword')}>
              <PasswordInput value={confirm} onChange={setConfirm} autoComplete="new-password" />
            </Field>

            {confirm && next !== confirm && <p className="text-sm text-red-300">{t('pwMismatch')}</p>}
            {pwMsg && <Msg kind={pwMsg.kind}>{pwMsg.text}</Msg>}

            <button
              type="submit"
              disabled={pwBusy || !current || !next || !confirm}
              style={{ padding: '0.8rem 2rem' }}
              className="w-full rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:self-start"
            >
              {pwBusy ? t('saving') : t('changePassword')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
