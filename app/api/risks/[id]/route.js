import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const allowed = ['title', 'description', 'jncsf_capability', 'likelihood', 'impact', 'status'];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    // Recalculate score if likelihood or impact changed
    if (updates.likelihood || updates.impact) {
      const { data: existing } = await supabase.from('risks').select('likelihood, impact').eq('id', id).single();
      const l = Number(updates.likelihood ?? existing.likelihood);
      const i = Number(updates.impact ?? existing.impact);
      updates.quantitative_score = l * i;
      if (updates.quantitative_score >= 20) updates.severity_level = 'Critical';
      else if (updates.quantitative_score >= 12) updates.severity_level = 'High';
      else if (updates.quantitative_score >= 6) updates.severity_level = 'Medium';
      else updates.severity_level = 'Low';
    }

    const { data, error } = await supabase
      .from('risks')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ error: 'Risk not found' }, { status: 404 });

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const { error } = await supabase
      .from('risks')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
