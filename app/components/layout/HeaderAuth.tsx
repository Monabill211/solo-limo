'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { User } from '@supabase/supabase-js';
import { createClient } from '../../lib/supabase/client';

export default function HeaderAuth() {
  const router = useRouter();
  const ar = useLocale() === 'ar';
  const [supabase] = useState(() => createClient());
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadProfile(u: User) {
      if (loadedFor.current === u.id) return;
      loadedFor.current = u.id;
      const fallback =
        (u.user_metadata?.full_name as string) || u.email?.split('@')[0] || '';
      setName(fallback);
      try {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', u.id)
          .maybeSingle();
        if (!alive) return;
        if (data?.full_name) setName(data.full_name);
        setIsAdmin(data?.role === 'admin');
      } catch {
        loadedFor.current = null;
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      const u = data.session?.user ?? null;
      setUser(u);
      setReady(true);
      if (u) loadProfile(u);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      if (event === 'SIGNED_OUT') {
        loadedFor.current = null;
        setUser(null);
        setName('');
        setIsAdmin(false);
        return;
      }
      if (!session?.user) return;
      setUser(session.user);
      setReady(true);
      if (event === 'TOKEN_REFRESHED') return;
      setTimeout(() => {
        if (alive && session.user) loadProfile(session.user);
      }, 0);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    setOpen(false);
    router.push('/');
    router.refresh();
  }

  if (!ready) return <div style={{ width: 90, height: 36 }} />;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-gold text-gold text-sm font-semibold hover:bg-gold hover:text-navy transition"
        style={{ padding: '8px 16px' }}
      >
        {ar ? 'تسجيل الدخول' : 'Login'}
      </Link>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-line text-gold text-sm font-semibold hover:border-gold transition"
        style={{ padding: '8px 14px' }}
      >
        <span>{ar ? `مرحباً، ${name}` : `Hello, ${name}`}</span>
        <span style={{ fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute end-0 top-full z-50 min-w-48 rounded-xl border border-line bg-navy-light shadow-xl"
          style={{ marginTop: 8, padding: 6 }}
        >
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="block rounded-lg text-sm text-white hover:bg-navy hover:text-gold transition"
            style={{ padding: '10px 12px' }}
          >
            {ar ? 'حسابي' : 'My account'}
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="block rounded-lg text-sm text-white hover:bg-navy hover:text-gold transition"
              style={{ padding: '10px 12px' }}
            >
              {ar ? 'لوحة التحكم' : 'Admin panel'}
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="block w-full text-start rounded-lg text-sm text-red-400 hover:bg-navy transition"
            style={{ padding: '10px 12px' }}
          >
            {ar ? 'تسجيل الخروج' : 'Logout'}
          </button>
        </div>
      )}
    </div>
  );
}