import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Fetch all risks ordered by quantitative_score descending
    const { data: risks, error: risksError } = await supabase
      .from('risks')
      .select('*')
      .order('quantitative_score', { ascending: false });

    if (risksError) {
      console.error('Error fetching risks:', risksError);
      return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
    }

    // Fetch evidence documentation for risks
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_documentation')
      .select('entity_id, file_url')
      .eq('entity_type', 'Risk');

    if (evidenceError) {
      console.error('Error fetching evidence for risks:', evidenceError);
      return NextResponse.json({ error: 'Failed to fetch evidence documentation' }, { status: 500 });
    }

    // Merge evidence into risks
    const risksWithEvidence = risks.map((risk) => {
      // Find all file URLs associated with this risk
      const riskEvidence = evidence.filter((e) => e.entity_id === risk.id);
      return {
        ...risk,
        // Typically there might be one or multiple files. We store them in an array
        file_urls: riskEvidence.map((e) => e.file_url)
      };
    });

    return NextResponse.json(risksWithEvidence, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in GET /api/risks:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
