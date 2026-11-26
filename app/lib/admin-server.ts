import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createAuthClient } from './auth-server';
import { getAdminAccess } from './admin-access';

export { serviceClient } from './supabase/service';

export async function isAdminRequest() {
  return (await getAdminAccess(await createAuthClient())).status === 'admin';
}

const readAdminAccess = cache(async () => {
  await connection();
  return getAdminAccess(await createAuthClient({ writable: false }));
});

export async function requireAdmin() {
  const { status } = await readAdminAccess();
  if (status === 'unavailable') throw new Error('تعذّر التحقق من صلاحيات لوحة التحكم مؤقتاً.');
  if (status === 'forbidden') redirect('/admin/login?error=forbidden');
  if (status === 'signed-out') redirect('/admin/login');
}
