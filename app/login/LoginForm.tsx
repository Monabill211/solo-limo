'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { createClient } from '../lib/supabase/client';

const WHATSAPP_URL = 'https://wa.me/201044443195';

type Mode = 'login' | 'signup';

function strengthScore(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  minLength,
  autoComplete,
  ltr,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'email' | 'tel' | 'password';
  required?: boolean;
  minLength?: number;
  autoComplete?: string;
  ltr?: boolean;
  placeholder?: string;
}) {
  const t = useTranslations('Auth');
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-bold text-white/85">{label}</span>
      <div className="relative">
        <input
          type={isPassword && show ? 'text' : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          placeholder={placeholder}
          dir={ltr || isPassword ? 'ltr' : undefined}
          style={{ padding: '0.8rem 1rem' }}
          className={`${inputClass} ${ltr || isPassword ? 'text-start' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? t('hidePassword') : t('showPassword')}
            className="block text-sm font-semibold text-gold-light hover:underline"
            style={{ marginInlineStart: 'auto', marginBlockStart: '0.4rem' }}
          >
            {show ? t('hidePassword') : t('showPassword')}
          </button>
        )}
      </div>
    </label>
  );
}

export default function LoginForm({ signup, nextPath, confirmationFailed, confirmationError }: {
  signup: boolean;
  nextPath: string;
  confirmationFailed: boolean;
  confirmationError?: string;
}) {
  const t = useTranslations('Auth');

  const [mode, setMode] = useState<Mode>(signup ? 'signup' : 'login');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(confirmationError ?? (confirmationFailed ? t('confirmationFailed') : ''));
  const [confirmationPending, setConfirmationPending] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';
  const score = strengthScore(password);
  const strengthLabels = ['', t('strengthWeak'), t('strengthOk'), t('strengthGood'), t('strengthStrong')];

  function switchMode(m: Mode) {
    setMode(m);
    setConfirmationPending(false);
    setError('');
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setConfirmationPending(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const credentials = { email: email.trim(), password };
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
      } else {
        const callback = new URL('/auth/callback', window.location.origin);
        callback.searchParams.set('next', nextPath);
        const { data, error } = await supabase.auth.signUp({
          ...credentials,
          options: { data: { full_name: fullName.trim(), phone: phone.trim() }, emailRedirectTo: callback.href },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationPending(true);
          return;
        }
      }
      // A fresh document request sends the newly written session cookie to Next.js.
      window.location.assign(nextPath);
    } catch (error) {
      setError(error instanceof Error ? error.message : t('genericError'));
      setErrorKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  }

  const waLink = `${WHATSAPP_URL}?text=${encodeURIComponent(t('forgotMessage') + email)}`;

  return (
    <div
      className="relative isolate flex items-center justify-center overflow-hidden"
      style={{ padding: '3rem 1rem', minHeight: '80vh' }}
    >
      <span className="pointer-events-none absolute -top-24 -start-24 -z-10 h-96 w-96 animate-pulse rounded-full bg-gold/15 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -end-24 -z-10 h-80 w-80 animate-pulse rounded-full bg-gold/10 blur-3xl" />

      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-line bg-navy-light shadow-2xl shadow-black/50 md:grid-cols-[1fr_1.15fr]">
        {/* ================= الجانب البصري ================= */}
        <aside
          className="relative flex flex-col items-center justify-center overflow-hidden border-b border-line bg-linear-to-br from-[#1c2943] to-navy text-center md:border-b-0 md:border-e"
          style={{ padding: '2.5rem 1.75rem' }}
        >
          <span className="pointer-events-none absolute -top-16 start-1/4 h-52 w-52 rounded-full bg-gold/20 blur-3xl" />

          <img
            src="/logo.png"
            alt="Solo Limo"
            className="relative h-24 w-auto drop-shadow-[0_0_24px_rgba(201,162,39,0.5)] md:h-36"
            style={{ marginBlockEnd: '1rem' }}
          />

          <div key={mode} className="relative animate-[fadeIn_0.5s_ease-out]">
            <h2 className="text-2xl font-extrabold text-gold-light" style={{ marginBlockEnd: '0.5rem' }}>
              {isLogin ? t('welcomeBack') : t('joinUs')}
            </h2>
            <p className="hidden leading-8 text-muted md:block">
              {isLogin ? t('welcomeBackText') : t('joinUsText')}
            </p>

            {!isLogin && (
              <ul
                className="hidden flex-col gap-2.5 text-start md:inline-flex"
                style={{ marginBlockStart: '1.25rem' }}
              >
                {[t('perk1'), t('perk2'), t('perk3')].map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-white/85">
                    <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* ================= الفورم ================= */}
        <section className="flex flex-col" style={{ padding: '2rem 1.75rem' }}>
          {/* السويتش */}
          <div
            role="tablist"
            className="relative grid grid-cols-2 rounded-full border border-line bg-navy"
            style={{ padding: '0.3rem', marginBlockEnd: '1.75rem' }}
          >
            <span
              className={`absolute inset-y-[0.3rem] w-[calc(50%-0.3rem)] rounded-full bg-linear-to-br from-gold to-gold-light shadow-lg shadow-gold/40 transition-[inset-inline-start] duration-500 ease-[cubic-bezier(0.6,-0.2,0.3,1.3)] ${
                isLogin ? 'start-[0.3rem]' : 'start-1/2'
              }`}
            />
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                style={{ padding: '0.55rem 0.75rem' }}
                className={`relative z-10 font-bold transition-colors duration-300 ${
                  mode === m ? 'text-navy' : 'text-muted hover:text-white'
                }`}
              >
                {m === 'login' ? t('tabLogin') : t('tabSignup')}
              </button>
            ))}
          </div>

          {confirmationPending && <p role="status" className="mb-4 rounded-xl bg-gold/10 p-3 text-gold-light">{t('confirmationPending')}</p>}
          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="grid">
              {/* ----- تسجيل الدخول ----- */}
              <fieldset
                disabled={!isLogin}
                inert={!isLogin}
                className={`col-start-1 row-start-1 flex flex-col gap-4 transition-all duration-500 ${
                  isLogin
                    ? 'visible translate-x-0 opacity-100'
                    : 'pointer-events-none invisible opacity-0 ltr:-translate-x-10 rtl:translate-x-10'
                }`}
              >
                <Field
                  label={t('email')}
                  type="email"
                  ltr
                  value={email}
                  onChange={setEmail}
                  required={isLogin}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
                <Field
                  label={t('password')}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required={isLogin}
                  autoComplete="current-password"
                />
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="w-fit text-sm text-gold-light hover:underline"
                >
                  {t('forgot')}
                </a>
              </fieldset>

              {/* ----- إنشاء حساب ----- */}
              <fieldset
                disabled={isLogin}
                inert={isLogin}
                className={`col-start-1 row-start-1 flex flex-col gap-4 transition-all duration-500 ${
                  !isLogin
                    ? 'visible translate-x-0 opacity-100'
                    : 'pointer-events-none invisible opacity-0 ltr:translate-x-10 rtl:-translate-x-10'
                }`}
              >
                <Field
                  label={t('fullName')}
                  value={fullName}
                  onChange={setFullName}
                  required={!isLogin}
                  autoComplete="name"
                />
                <Field
                  label={t('phone')}
                  type="tel"
                  ltr
                  value={phone}
                  onChange={setPhone}
                  required={!isLogin}
                  autoComplete="tel"
                  placeholder="+20 10 0000 0000"
                />
                <Field
                  label={t('email')}
                  type="email"
                  ltr
                  value={email}
                  onChange={setEmail}
                  required={!isLogin}
                  autoComplete="email"
                  placeholder="name@example.com"
                />
                <Field
                  label={t('password')}
                  type="password"
                  value={password}
                  onChange={setPassword}
                  required={!isLogin}
                  minLength={8}
                  autoComplete="new-password"
                />

                <div className="flex items-center gap-3">
                  <div className="grid flex-1 grid-cols-4 gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <span
                        key={n}
                        className={`h-1 rounded-full transition-colors duration-300 ${
                          score >= n
                            ? score === 1
                              ? 'bg-red-400'
                              : score === 2
                                ? 'bg-amber-400'
                                : score === 3
                                  ? 'bg-gold-light'
                                  : 'bg-emerald-400'
                            : 'bg-line'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="min-w-14 text-end text-xs text-muted">
                    {strengthLabels[score]}
                  </span>
                </div>
                <p className="text-xs text-muted">{t('passwordHint')}</p>
              </fieldset>
            </div>

            {error && (
              <p
                key={errorKey}
                role="alert"
                className="animate-[shake_0.45s_ease] rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300"
                style={{ padding: '0.7rem 1rem' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ padding: '0.9rem 1.5rem' }}
              className="rounded-xl bg-linear-to-br from-gold to-gold-light text-lg font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? t('loading') : isLogin ? t('login') : t('signup')}
            </button>
          </form>

          <button
            type="button"
            onClick={() => switchMode(isLogin ? 'signup' : 'login')}
            className="text-sm text-gold-light hover:underline"
            style={{ marginBlockStart: '1.25rem' }}
          >
            {isLogin ? t('noAccount') : t('haveAccount')}
          </button>

          <Link
            href="/"
            className="text-center text-sm text-muted transition hover:text-gold-light"
            style={{ marginBlockStart: '0.75rem' }}
          >
            {t('backHome')}
          </Link>
        </section>
      </div>
    </div>
  );
}
