import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // 1. Fetch all compliance controls
    const { data: complianceControls, error: complianceError } = await supabase
      .from('compliance_controls')
      .select('*');

    if (complianceError) {
      console.error('Error fetching compliance controls:', complianceError);
      return NextResponse.json({ error: 'Failed to fetch compliance controls' }, { status: 500 });
    }

    // 2. Fetch risks to get the titles of linked risks
    // We check both 'risk_id' and 'linked_risk_id' in case either naming convention was used
    const riskIds = [...new Set(complianceControls
      .map(c => c.risk_id || c.linked_risk_id)
      .filter(id => id))];
      
    let riskMapping = {};
    if (riskIds.length > 0) {
      const { data: risks, error: risksError } = await supabase
        .from('risks')
        .select('id, title')
        .in('id', riskIds);
        
      if (!risksError && risks) {
        risks.forEach(r => {
          riskMapping[r.id] = r.title;
        });
      }
    }

    // 3. Fetch evidence documentation for compliance controls
    const { data: evidence, error: evidenceError } = await supabase
      .from('evidence_documentation')
      .select('entity_id, file_url')
      .eq('entity_type', 'Compliance');

    if (evidenceError) {
      console.error('Error fetching evidence for compliance:', evidenceError);
      return NextResponse.json({ error: 'Failed to fetch evidence documentation' }, { status: 500 });
    }

    // 4. Merge everything into the final array
    const controlsMerged = complianceControls.map((control) => {
      // Find all file URLs associated with this control
      const controlEvidence = evidence.filter((e) => e.entity_id === control.id);
      
      // Determine associated risk ID and title
      const associatedRiskId = control.risk_id || control.linked_risk_id;
      const riskTitle = associatedRiskId ? riskMapping[associatedRiskId] : null;

      return {
        ...control,
        risk_title: riskTitle,
        // Typically there might be one or multiple files. We store them in an array
        file_urls: controlEvidence.map((e) => e.file_url)
      };
    });

    return NextResponse.json(controlsMerged, { status: 200 });
  } catch (err) {
    console.error('Unexpected error in GET /api/compliance:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
