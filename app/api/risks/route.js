import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // ── Auth check: any authenticated user may read their own risks ──
    // Ownership scoping is enforced by the Supabase RLS policy
    // (auth.uid() = user_id), so no role check is needed here.
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required', code: 'UNAUTHENTICATED' },
        { status: 401 }
      );
    }

    // Fetch all risks ordered by quantitative_score descending
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .order('quantitative_score', { ascending: false });

    if (risksError) {
      // Log the raw Supabase error so the exact failure is visible in server logs
      console.error('Export Crash — risks query failed:', risksError);
      return NextResponse.json(
        { error: 'Failed to fetch risks', details: risksError.message },
        { status: 500 }
      );
    }

    // Fetch evidence files linked to risks.
    // The evidence_documentation table (migration 003) uses `risk_id` as the
    // FK to risks — NOT `entity_id` / `entity_type` (those belong to the
    // separate `evidence` table added in migration 008).
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_documentation')
      .select('risk_id, file_url');

    if (evidenceError) {
      console.error('Export Crash — evidence query failed:', evidenceError);
      return NextResponse.json(
        { error: 'Failed to fetch evidence documentation', details: evidenceError.message },
        { status: 500 }
      );
    }

    // Merge evidence files into their parent risk rows
    const risksWithEvidence = risks.map((risk) => {
      const riskEvidence = (evidence || []).filter((e) => e.risk_id === risk.id);
      return {
        ...risk,
        file_urls: riskEvidence.map((e) => e.file_url),
      };
    });

    return NextResponse.json(risksWithEvidence, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in GET /api/risks:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
