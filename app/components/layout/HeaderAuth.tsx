'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { createClient } from '../../lib/supabase/client';

type Me = { name: string; isAdmin: boolean } | null;

export default function HeaderAuth() {
  const t = useTranslations('Header');
  const router = useRouter();

  // undefined = لسه بنتأكد، null = مش مسجّل دخول
  const [me, setMe] = useState<Me | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;

      if (!user) {
        setMe(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      const full =
        profile?.full_name?.trim() ||
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split('@')[0] ||
        '';

      setMe({
        name: full.split(' ')[0],
        isAdmin: profile?.role === 'admin',
      });
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, []);

  // قفل القائمة لما تدوس برّاها
  useEffect(() => {
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  async function logout() {
    await createClient().auth.signOut();
    setOpen(false);
    setMe(null);
    router.refresh();
  }

  // لسه بنتأكد: مكان فاضي بنفس الحجم عشان الهيدر ما يتنططش
  if (me === undefined) {
    return <div className="h-10 w-28 animate-pulse rounded-xl bg-white/5" />;
  }

  // مش مسجّل دخول
  if (me === null) {
    return (
      <>
        <Link
          href="/login"
          className="hidden text-muted transition-colors hover:text-gold-light md:block"
        >
          {t('login')}
        </Link>

        <Link
          href="/login?mode=signup"
          style={{ padding: '0.5rem 1.4rem' }}
          className="rounded-xl bg-linear-to-br from-gold to-gold-light font-bold text-navy transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-gold/40"
        >
          {t('signup')}
        </Link>
      </>
    );
  }

  // مسجّل دخول
  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        style={{ padding: '0.3rem 0.8rem 0.3rem 0.4rem' }}
        className="flex items-center gap-2.5 rounded-xl border border-line transition hover:border-gold"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-gold to-gold-light font-extrabold text-navy">
          {me.name.charAt(0).toUpperCase()}
        </span>

        <span className="max-w-28 truncate text-sm font-bold text-white sm:max-w-40">
          {t('hello', { name: me.name })}
        </span>

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`h-4 w-4 shrink-0 text-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`${open ? 'flex' : 'hidden'} absolute end-0 top-full z-50 min-w-52 flex-col overflow-hidden rounded-xl border border-line bg-navy-light shadow-xl shadow-black/40`}
        style={{ marginBlockStart: '0.5rem' }}
      >
        {me.isAdmin && (
          <Link
            href="/admin"
            onClick={() => setOpen(false)}
            style={{ padding: '0.7rem 1.1rem' }}
            className="font-bold text-gold-light transition-colors hover:bg-navy"
          >
            {t('adminPanel')}
          </Link>
        )}

        <button
          type="button"
          onClick={logout}
          style={{ padding: '0.7rem 1.1rem' }}
          className="text-start font-bold text-white transition-colors hover:bg-navy hover:text-red-300"
        >
          {t('logout')}
        </button>
      </div>
    </div>
  );
}