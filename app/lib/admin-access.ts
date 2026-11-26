import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { serviceClient } from './supabase/service';

export async function getAdminAccess(auth: SupabaseClient) {
  let result: Awaited<ReturnType<typeof auth.auth.getUser>>;
  try {
    result = await auth.auth.getUser();
  } catch {
    return { status: 'unavailable', source: 'auth' } as const;
  }
  const { data: { user }, error } = result;
  if (error && error.name !== 'AuthSessionMissingError' &&
      !['session_not_found', 'user_not_found'].includes(error.code ?? '')) {
    return { status: 'unavailable', source: 'auth' } as const;
  }
  if (!user || error) return { status: 'signed-out' } as const;

  // The role comes from the database for the verified user ID. This lookup
  // still works when the project's profile policies need to be repaired.
  try {
    const { data: profile, error } = await serviceClient()
      .from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!error) return { status: profile?.role === 'admin' ? 'admin' : 'forbidden' } as const;
  } catch {
    // A failed role lookup must keep the verified user's refreshed session.
  }
  return { status: 'unavailable', source: 'profiles' } as const;
}
