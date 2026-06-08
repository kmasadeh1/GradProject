import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = getAdminClient();
    const { data: { users }, error } = await adminClient.auth.admin.listUsers();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, full_name, role');

    const profileMap = {};
    (profiles || []).forEach(p => { profileMap[p.id] = p; });

    const merged = users.map(u => ({
      id: u.id,
      email: u.email,
      full_name: profileMap[u.id]?.full_name || '',
      role: profileMap[u.id]?.role || 'user',
      created_at: u.created_at,
    }));

    return NextResponse.json(merged, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, role, full_name } = body;

    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });

    const adminClient = getAdminClient();

    // full_name update
    if (full_name !== undefined) {
      const { error } = await adminClient
        .from('profiles')
        .update({ full_name })
        .eq('id', userId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // role update
    const validRoles = ['user', 'admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    if (['admin', 'super_admin'].includes(role) && profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Only super_admin can assign admin roles' }, { status: 403 });
    }

    const { error } = await adminClient
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden — super_admin only' }, { status: 403 });
    }

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    if (userId === user.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const adminClient = getAdminClient();
    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
