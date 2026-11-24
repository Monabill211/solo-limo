import { randomInt } from 'crypto';
import { NextResponse } from 'next/server';
import { isAdminRequest, serviceClient } from '../../../../../lib/admin-server';

// من غير الحروف المتشابهة (O و 0 و I و l و 1) عشان تتقرا بسهولة في الواتساب
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function generatePassword(length = 10) {
  let s = '';
  for (let i = 0; i < length; i++) s += CHARS[randomInt(CHARS.length)];
  return s;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const admin = serviceClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', id)
    .maybeSingle();

  if (!profile) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (profile.role === 'admin') {
    return NextResponse.json({ error: 'admin_not_allowed' }, { status: 400 });
  }

  const password = generatePassword();
  const { error } = await admin.auth.admin.updateUserById(id, { password });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ password });
}