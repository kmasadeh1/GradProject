import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const { control_name, risk_id, jncsf_principle, compliance_status, notes } = body;

    if (!control_name) return NextResponse.json({ error: 'control_name is required' }, { status: 400 });

    const { data, error } = await supabase
      .from('compliance_controls')
      .insert({
        user_id: user.id,
        control_name: control_name.trim(),
        risk_id: risk_id || null,
        jncsf_principle: jncsf_principle || null,
        compliance_status: compliance_status || 'Partial',
        notes: notes?.trim() || null,
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('POST compliance/controls error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
