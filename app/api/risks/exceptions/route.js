import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getCallerProfile(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return { user, profile };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { user, profile } = await getCallerProfile(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = profile && ['admin', 'super_admin'].includes(profile.role);

    let query = supabase
      .from('risk_exceptions')
      .select('*, risks(title)')
      .order('created_at', { ascending: false });

    // Admins see all exceptions; regular users see only their own
    if (!isAdmin) {
      query = query.eq('requested_by', user.id);
    }

    const { data: exceptions, error } = await query;

    if (error) {
      if (error.code === '42P01') return NextResponse.json([], { status: 200 });
      throw error;
    }

    // Enrich with requester email (admin view only — avoids service role call for regular users)
    let enriched = exceptions ?? [];
    if (isAdmin) {
      const userIds = [...new Set(enriched.map((e) => e.requested_by || e.user_id).filter(Boolean))];
      let emailMap = {};
      if (userIds.length > 0) {
        const admin = getAdminClient();
        const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
        for (const u of authUsers?.users ?? []) {
          if (userIds.includes(u.id)) emailMap[u.id] = u.email;
        }
      }
      enriched = enriched.map((e) => ({
        ...e,
        requester_email: (e.requested_by || e.user_id)
          ? (emailMap[e.requested_by] ?? emailMap[e.user_id] ?? null)
          : null,
      }));
    }

    return NextResponse.json(enriched, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { risk_id, justification, expiration_date } = body;

    if (!risk_id || !justification || !expiration_date) {
      return NextResponse.json({ error: 'risk_id, justification, and expiration_date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('risk_exceptions')
      .insert([{
        risk_id,
        justification,
        expiration_date,
        status: 'Pending',
        requested_by: session.user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('risk_exceptions insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('POST /api/risks/exceptions error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { exception_id, status } = await request.json();

    if (!exception_id || !['Approved', 'Denied'].includes(status)) {
      return NextResponse.json({ error: 'Invalid exception_id or status' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('risk_exceptions')
      .update({ status })
      .eq('id', exception_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (status === 'Approved') {
      await supabase
        .from('risks')
        .update({ is_excepted: true })
        .eq('id', data.risk_id);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
