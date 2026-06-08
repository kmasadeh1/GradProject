import { createClient } from '@/lib/supabase/server';

/**
 * Fetches the current user and their profile from Supabase server-side.
 * Call this in async Server Components / page.js files so the profile is
 * available at render time — eliminates the client-side waterfall.
 *
 * Returns { user, profile } where profile defaults to safe fallback values
 * when the row is missing (e.g. new accounts not yet in the profiles table).
 */
export async function getServerProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profile = { role: 'user', full_name: '', avatar_url: null };

  if (user) {
    const { data } = await supabase
      .from('profiles')
      .select('role, full_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();
    if (data) profile = data;
  }

  return { user, profile };
}
