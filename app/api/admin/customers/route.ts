import { NextResponse } from 'next/server';
import { isAdminRequest, serviceClient } from '../../../lib/admin-server';

// بيرجّع إيميلات العملاء (الإيميل مخزّن في Supabase Auth مش في جدول profiles)
export async function GET() {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = serviceClient();
  const emails: Record<string, string> = {};

  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    data.users.forEach((u) => {
      if (u.email) emails[u.id] = u.email;
    });

    if (data.users.length < 1000) break;
    page += 1;
  }

  return NextResponse.json({ emails });
}