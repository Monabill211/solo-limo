'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../lib/supabase/client';

const inputClass =
  'w-full rounded-xl border border-line bg-navy text-white placeholder:text-muted transition focus:border-gold focus:shadow-lg focus:shadow-gold/10 focus:outline-none';

export default function AdminLoginForm({ reason }: { reason?: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(
    reason === 'unavailable' ? 'تعذّر التحقق من صلاحيات الحساب. حاول مرة تانية.' :
    reason === 'forbidden' ? 'الحساب ده مش مسموح له بدخول لوحة التحكم.' : ''
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await createClient().auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      if (!data.user) throw new Error('تعذّر تحميل الحساب.');
      window.location.replace('/admin');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'حصل خطأ، حاول مرة تانية.');
      setLoading(false);
    }
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
                style={{ padding: '0.8rem 1rem' }}
                className={`${inputClass} text-start`}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                aria-label={show ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="block text-sm font-semibold text-gold-light hover:underline"
                style={{ marginInlineStart: 'auto', marginBlockStart: '0.4rem' }}
              >
                {show ? 'إخفاء' : 'إظهار'}
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