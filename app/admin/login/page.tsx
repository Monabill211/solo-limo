'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '../../lib/supabase/client';

const eye = (off: boolean) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-5 w-5"
  >
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // لو اتحوّل هنا لأن الحساب مش أدمن
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('error') === 'forbidden') {
      createClient().auth.signOut();
      setError('الحساب ده مش مسموح له بدخول لوحة التحكم.');
    }
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !data.user) {
      setError(
        signInError?.message.toLowerCase().includes('invalid')
          ? 'الإيميل أو كلمة المرور غير صحيحة.'
          : 'حصل خطأ، حاول مرة تانية.'
      );
      setLoading(false);
      return;
    }

    // لازم يكون أدمن
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile?.role !== 'admin') {
      await supabase.auth.signOut();
      setError('الحساب ده مش مسموح له بدخول لوحة التحكم.');
      setLoading(false);
      return;
    }

    router.replace('/admin');
    router.refresh();
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-navy text-white"
      style={{ padding: '2rem 1rem' }}
    >
      <span className="pointer-events-none absolute -top-24 -start-24 -z-10 h-96 w-96 rounded-full bg-gold/15 blur-3xl" />
      <span className="pointer-events-none absolute -bottom-24 -end-24 -z-10 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />

      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center" style={{ marginBlockEnd: '1.75rem' }}>
          <img
            src="/logo.png"
            alt="سولو ليمو"
            className="h-28 w-auto drop-shadow-[0_0_24px_rgba(201,162,39,0.45)]"
          />
        </div>

        <form
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-3xl border border-line bg-navy-light shadow-2xl shadow-black/40"
          style={{ padding: '2rem 1.75rem' }}
        >
          <div className="text-center">
            <span
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/40 bg-gold/10 text-gold"
              style={{ marginBlockEnd: '1rem' }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-7 w-7"
              >
                <rect x="4" y="11" width="16" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
            </span>
            <h1 className="text-2xl font-extrabold text-gold">دخول لوحة التحكم</h1>
            <p className="text-sm text-muted" style={{ marginBlockStart: '0.4rem' }}>
              للمدير فقط. سجّل دخولك للمتابعة.
            </p>
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-white/85">الإيميل</span>
            <input
              required
              type="email"
              dir="ltr"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{ padding: '0.8rem 1rem' }}
              className={`${inputClass} text-start`}
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-bold text-white/85">كلمة المرور</span>
            <div className="relative">
              <input
                required
                type={show ? 'text' : 'password'}
                dir="ltr"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ padding: '0.8rem 3rem 0.8rem 1rem' }}
                className={`${inputClass} text-start`}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-muted transition hover:text-gold-light"
              >
                {eye(show)}
              </button>
            </div>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/40 bg-red-500/10 text-center text-sm text-red-300"
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
            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <Link
          href="/"
          className="block text-center text-sm text-muted transition hover:text-gold-light"
          style={{ marginBlockStart: '1.5rem' }}
        >
          ← الرجوع للموقع
        </Link>
      </div>
    </div>
  );
}