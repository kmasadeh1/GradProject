import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required', code: 'UNAUTHENTICATED' }, { status: 401 });

    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .order('quantitative_score', { ascending: false, nullsFirst: false });

    if (risksError) return NextResponse.json({ error: 'Failed to fetch risks', details: risksError.message }, { status: 500 });

    const { data: evidence } = await supabase.from('evidence_documentation').select('risk_id, file_url');

    const risksWithEvidence = (risks || []).map((risk) => ({
      ...risk,
      file_urls: (evidence || []).filter((e) => e.risk_id === risk.id).map((e) => e.file_url),
    }));

    return NextResponse.json(risksWithEvidence, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    let body;
    try { body = await request.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }); }

    const { title, description, jncsf_capability, likelihood, impact } = body;

    if (!title || !jncsf_capability || likelihood == null || impact == null) {
      return NextResponse.json({ error: 'Missing required fields: title, jncsf_capability, likelihood, impact' }, { status: 400 });
    }

    const l = Number(likelihood);
    const i = Number(impact);
    const quantitative_score = l * i;
    let severity_level;
    if (quantitative_score >= 20) severity_level = 'Critical';
    else if (quantitative_score >= 12) severity_level = 'High';
    else if (quantitative_score >= 6) severity_level = 'Medium';
    else severity_level = 'Low';

    const { data, error } = await supabase
      .from('risks')
      .insert({
        user_id: user.id,
        title: title.trim(),
        description: description?.trim() ?? null,
        jncsf_capability,
        likelihood: l,
        impact: i,
        quantitative_score,
        severity_level,
        source: 'Manual',
        status: 'Open',
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error('POST /api/risks insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('POST /api/risks unexpected error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
